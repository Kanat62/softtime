import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CompanyStatus, SubStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Cron runs outside any HTTP request — no tenant context, all queries are cross-tenant.

@Injectable()
export class SubscriptionsCronService {
  private readonly logger = new Logger(SubscriptionsCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  // ─── §6.7  Subscription status transitions  (daily at 00:30 UTC) ─────────────

  @Cron('30 0 * * *')
  async checkSubscriptions(): Promise<void> {
    const now = new Date();
    const gracePeriodDays = this.configService.get<number>('GRACE_PERIOD_DAYS') ?? 7;
    const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
    const graceCutoff = new Date(now.getTime() - gracePeriodMs);

    // ── Step 1: GRACE → EXPIRED (process overdue grace first to avoid re-processing) ──

    const overdueGraceSubs = await this.prisma.subscription.findMany({
      where: {
        status: SubStatus.GRACE,
        periodEnd: { lt: graceCutoff },
      } as any,
      select: { id: true, companyId: true },
    });

    if (overdueGraceSubs.length > 0) {
      const ids = (overdueGraceSubs as any[]).map((s) => s.id as string);
      const companyIds = (overdueGraceSubs as any[]).map((s) => s.companyId as string);

      await Promise.all([
        this.prisma.subscription.updateMany({
          where: { id: { in: ids } } as any,
          data: { status: SubStatus.EXPIRED },
        }),
        this.prisma.company.updateMany({
          where: { id: { in: companyIds } },
          data: { status: CompanyStatus.SUSPENDED },
        }),
      ]);

      await Promise.all(
        companyIds.map((cid) =>
          this.notifications.sendToCompanyAdmins(
            cid,
            'Компания приостановлена',
            'Подписка не оплачена. Доступ к системе приостановлен.',
          ),
        ),
      );

      this.logger.log(
        `Suspended ${overdueGraceSubs.length} company(ies) — grace period expired`,
      );
    }

    // ── Step 2: TRIAL/ACTIVE with expired periodEnd → GRACE ───────────────────────

    const expiredSubs = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubStatus.TRIAL, SubStatus.ACTIVE] },
        periodEnd: { lt: now },
      } as any,
      select: { id: true, companyId: true },
    });

    if (expiredSubs.length > 0) {
      const ids = (expiredSubs as any[]).map((s) => s.id as string);
      const companyIds = (expiredSubs as any[]).map((s) => s.companyId as string);

      await this.prisma.subscription.updateMany({
        where: { id: { in: ids } } as any,
        data: { status: SubStatus.GRACE },
      });

      await Promise.all(
        companyIds.map((cid) =>
          this.notifications.sendToCompanyAdmins(
            cid,
            'Подписка истекает',
            `Оплатите подписку в течение ${gracePeriodDays} дн., иначе доступ будет приостановлен.`,
          ),
        ),
      );

      this.logger.log(
        `Moved ${expiredSubs.length} subscription(s) to GRACE`,
      );
    }
  }
}
