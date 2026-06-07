import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CompanyStatus, PaymentStatus, SubStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from '../../common/interfaces/payment-provider.interface';

const SUBSCRIPTION_PERIOD_DAYS = 30;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  // ─── GET /subscriptions/me ────────────────────────────────────────────────────

  async getMySubscription(companyId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { companyId },
    });
    if (!sub) throw new NotFoundException('Подписка не найдена');

    const now = Date.now();
    const daysLeft = Math.max(
      0,
      Math.ceil(((sub as any).periodEnd.getTime() - now) / (1000 * 60 * 60 * 24)),
    );

    return { ...(sub as any), daysLeft };
  }

  // ─── POST /subscriptions/pay ──────────────────────────────────────────────────

  async initiatePayment(companyId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { companyId } });
    if (!sub) throw new NotFoundException('Подписка не найдена');
    if ((sub as any).status === SubStatus.CANCELLED) {
      throw new ConflictException('Подписка отменена. Обратитесь в службу поддержки.');
    }

    const checkoutUrl = await this.paymentProvider.createCheckout(30, companyId);
    return { checkoutUrl };
  }

  // ─── POST /subscriptions/cancel ───────────────────────────────────────────────

  async cancelSubscription(companyId: string, actorId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { companyId } });
    if (!sub) throw new NotFoundException('Подписка не найдена');
    if ((sub as any).status === SubStatus.CANCELLED) {
      throw new ConflictException('Подписка уже отменена');
    }

    const [updatedSub] = await Promise.all([
      this.prisma.subscription.update({
        where: { companyId },
        data: { status: SubStatus.CANCELLED },
      }),
      this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.SUSPENDED },
      }),
    ]);

    await Promise.all([
      this.audit.log({
        actorId,
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'Subscription',
        entityId: (sub as any).id,
        meta: { companyId },
      }),
      this.notifications.sendToCompanyAdmins(
        companyId,
        'Подписка отменена',
        'Ваша подписка была отменена. Доступ к системе приостановлен.',
      ),
    ]);

    return updatedSub;
  }

  // ─── GET /payments ────────────────────────────────────────────────────────────

  async getPayments(companyId: string, query: { page: number; limit: number }) {
    const skip = (query.page - 1) * query.limit;
    const where = { companyId };
    const [total, data] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  // ─── POST /webhooks/payments ──────────────────────────────────────────────────

  async handleWebhook(
    payload: {
      companyId: string;
      status: string;
      providerRef?: string;
      amount?: number;
    },
    signature: string,
  ) {
    // Verify signature (stub — always passes in mock)
    const valid = this.paymentProvider.verifyWebhook(payload, signature);
    if (!valid) return { ok: false, reason: 'invalid_signature' };

    if (payload.status !== 'success') {
      return { ok: false, reason: 'non_success_status' };
    }

    const { companyId } = payload;

    const sub = await this.prisma.subscription.findUnique({ where: { companyId } });
    if (!sub) return { ok: false, reason: 'subscription_not_found' };

    const now = new Date();
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    await Promise.all([
      this.prisma.payment.create({
        data: {
          companyId,
          subscriptionId: (sub as any).id,
          amountUsd: payload.amount ?? 30,
          periodStart: now,
          periodEnd,
          status: PaymentStatus.PAID,
          provider: 'mock',
          providerRef: payload.providerRef ?? null,
        },
      }),
      this.prisma.subscription.update({
        where: { companyId },
        data: {
          status: SubStatus.ACTIVE,
          periodStart: now,
          periodEnd,
          nextBillingAt: periodEnd,
        },
      }),
      this.prisma.company.update({
        where: { id: companyId },
        data: { status: CompanyStatus.ACTIVE },
      }),
    ]);

    // Notify all PROVIDER users that a payment was received
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    await this.notifications.sendToProviders(
      'Поступила оплата',
      `Поступила оплата от компании «${(company as any)?.name ?? companyId}»`,
    );

    return { ok: true };
  }
}
