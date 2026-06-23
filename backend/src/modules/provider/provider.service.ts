import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyStatus, PaymentStatus, SubStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

// PROVIDER role: tenant extension is bypassed (ctx.role === UserRole.PROVIDER)
// → all queries are cross-tenant; companyId is never auto-injected.

@Injectable()
export class ProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [
      statusGroups,
      mrrAgg,
      totalAgg,
      recentCompanies,
      recentPayments,
    ] = await Promise.all([
      // Companies by status
      this.prisma.company.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      // MRR = PAID payments in current calendar month
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          createdAt: { gte: startOfMonth, lt: endOfMonth },
        },
        _sum: { amountUsd: true },
      }),
      // Total revenue (all time)
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amountUsd: true },
      }),
      // Last 10 company registrations
      this.prisma.company.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, companyCode: true, status: true, createdAt: true },
      }),
      // Last 10 payments
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          subscription: {
            select: { company: { select: { name: true } } },
          },
        },
      }),
    ]);

    // Build status counts map
    const byStatus: Record<string, number> = {
      TRIAL: 0,
      ACTIVE: 0,
      GRACE: 0,
      SUSPENDED: 0,
    };
    for (const g of statusGroups as any[]) {
      byStatus[g.status] = g._count._all as number;
    }

    return {
      companies: {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
      },
      revenue: {
        mrr: (mrrAgg._sum as any).amountUsd?.toNumber() ?? 0,
        total: (totalAgg._sum as any).amountUsd?.toNumber() ?? 0,
      },
      recentCompanies,
      recentPayments,
    };
  }

  // ─── Companies list ───────────────────────────────────────────────────────────

  async listCompanies(query: {
    status?: string;
    subscriptionStatus?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.subscriptionStatus) where.subscription = { status: query.subscriptionStatus };

    const skip = (query.page - 1) * query.limit;

    const [total, data] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: { select: { status: true, nextBillingAt: true, periodEnd: true } },
          _count: { select: { users: { where: { deletedAt: null } } } },
        },
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

  // ─── Company detail ───────────────────────────────────────────────────────────

  async getCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            payments: { orderBy: { createdAt: 'desc' }, take: 50 },
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!company) throw new NotFoundException('Компания не найдена');
    return company;
  }

  // ─── Activate ─────────────────────────────────────────────────────────────────

  async activateCompany(id: string, actorId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Компания не найдена');

    await Promise.all([
      this.prisma.company.update({
        where: { id },
        data: { status: CompanyStatus.ACTIVE },
      }),
      // Activate subscription only if it exists and not CANCELLED
      this.prisma.subscription.updateMany({
        where: { companyId: id, status: { notIn: [SubStatus.CANCELLED] as any } },
        data: { status: SubStatus.ACTIVE },
      }),
    ]);

    await this.audit.log({
      actorId,
      action: 'COMPANY_ACTIVATED',
      entityType: 'Company',
      entityId: id,
      meta: { companyName: (company as any).name },
      companyId: id,
    });

    return { ok: true };
  }

  // ─── Hard delete a company and ALL related data ───────────────────────────────
  // Removes the tenant entirely from the database (admin + workers + attendance +
  // schedules + requests + networks + QR + news + payments + subscription + ...).
  // Irreversible. PROVIDER-only.

  async deleteCompany(id: string, actorId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!company) throw new NotFoundException('Компания не найдена');

    const users = await this.prisma.user.findMany({
      where: { companyId: id },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    // Children first (respect FK: NewsRead→News, Payment→Subscription,
    // Subscription→Company, User→Company), then the company itself.
    await this.prisma.$transaction([
      this.prisma.newsRead.deleteMany({ where: { news: { companyId: id } } }),
      this.prisma.news.deleteMany({ where: { companyId: id } }),
      this.prisma.payment.deleteMany({ where: { companyId: id } }),
      this.prisma.subscription.deleteMany({ where: { companyId: id } }),
      this.prisma.deviceToken.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.attendance.deleteMany({ where: { companyId: id } }),
      this.prisma.employeeSchedule.deleteMany({ where: { companyId: id } }),
      this.prisma.absenceRequest.deleteMany({ where: { companyId: id } }),
      this.prisma.officeNetwork.deleteMany({ where: { companyId: id } }),
      this.prisma.qrToken.deleteMany({ where: { companyId: id } }),
      this.prisma.workSettings.deleteMany({ where: { companyId: id } }),
      this.prisma.aiInsight.deleteMany({ where: { companyId: id } }),
      this.prisma.companyDefaultSchedule.deleteMany({ where: { companyId: id } }),
      this.prisma.auditLog.deleteMany({ where: { companyId: id } }),
      this.prisma.user.deleteMany({ where: { companyId: id } }),
      this.prisma.company.delete({ where: { id } }),
    ]);

    // Final platform-level audit record (companyId has no FK, safe after delete).
    await this.audit.log({
      actorId,
      action: 'COMPANY_DELETED',
      entityType: 'Company',
      entityId: id,
      meta: { companyName: company.name, deletedUsers: userIds.length },
      companyId: id,
    });

    return { ok: true };
  }

  // ─── Suspend ──────────────────────────────────────────────────────────────────

  async suspendCompany(id: string, actorId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Компания не найдена');

    await this.prisma.company.update({
      where: { id },
      data: { status: CompanyStatus.SUSPENDED },
    });

    await Promise.all([
      this.audit.log({
        actorId,
        action: 'COMPANY_SUSPENDED',
        entityType: 'Company',
        entityId: id,
        meta: { companyName: (company as any).name },
        companyId: id,
      }),
      this.notifications.sendToCompanyAdmins(
        id,
        'Компания приостановлена',
        'Ваша компания была приостановлена администратором платформы.',
      ),
    ]);

    return { ok: true };
  }

  // ─── Payments ─────────────────────────────────────────────────────────────────

  async listPayments(query: {
    from?: Date;
    to?: Date;
    companyId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.companyId) where.companyId = query.companyId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }

    const skip = (query.page - 1) * query.limit;

    const [aggregate, total, data] = await Promise.all([
      this.prisma.payment.aggregate({
        where,
        _sum: { amountUsd: true },
        _count: { _all: true },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: { company: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    const totalAmount = (aggregate._sum as any).amountUsd?.toNumber() ?? 0;
    const count = (aggregate._count as any)._all as number;

    return {
      summary: {
        totalAmount,
        count,
        avgAmount: count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0,
      },
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
}
