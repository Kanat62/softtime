"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ProviderService = class ProviderService {
    constructor(prisma, audit, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
    }
    async getDashboard() {
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        const [statusGroups, mrrAgg, totalAgg, recentCompanies, recentPayments,] = await Promise.all([
            this.prisma.company.groupBy({
                by: ['status'],
                where: { deletedAt: null },
                _count: { _all: true },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: shared_1.PaymentStatus.PAID,
                    createdAt: { gte: startOfMonth, lt: endOfMonth },
                },
                _sum: { amountUsd: true },
            }),
            this.prisma.payment.aggregate({
                where: { status: shared_1.PaymentStatus.PAID },
                _sum: { amountUsd: true },
            }),
            this.prisma.company.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, name: true, companyCode: true, status: true, createdAt: true },
            }),
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
        const byStatus = {
            TRIAL: 0,
            ACTIVE: 0,
            GRACE: 0,
            SUSPENDED: 0,
        };
        for (const g of statusGroups) {
            byStatus[g.status] = g._count._all;
        }
        return {
            companies: {
                total: Object.values(byStatus).reduce((a, b) => a + b, 0),
                byStatus,
            },
            revenue: {
                mrr: mrrAgg._sum.amountUsd?.toNumber() ?? 0,
                total: totalAgg._sum.amountUsd?.toNumber() ?? 0,
            },
            recentCompanies,
            recentPayments,
        };
    }
    async listCompanies(query) {
        const where = { deletedAt: null };
        if (query.status)
            where.status = query.status;
        if (query.search)
            where.name = { contains: query.search, mode: 'insensitive' };
        if (query.subscriptionStatus)
            where.subscription = { status: query.subscriptionStatus };
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
    async getCompany(id) {
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
        if (!company)
            throw new common_1.NotFoundException('Компания не найдена');
        return company;
    }
    async activateCompany(id, actorId) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('Компания не найдена');
        await Promise.all([
            this.prisma.company.update({
                where: { id },
                data: { status: shared_1.CompanyStatus.ACTIVE },
            }),
            this.prisma.subscription.updateMany({
                where: { companyId: id, status: { notIn: [shared_1.SubStatus.CANCELLED] } },
                data: { status: shared_1.SubStatus.ACTIVE },
            }),
        ]);
        await this.audit.log({
            actorId,
            action: 'COMPANY_ACTIVATED',
            entityType: 'Company',
            entityId: id,
            meta: { companyName: company.name },
            companyId: id,
        });
        return { ok: true };
    }
    async suspendCompany(id, actorId) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('Компания не найдена');
        await this.prisma.company.update({
            where: { id },
            data: { status: shared_1.CompanyStatus.SUSPENDED },
        });
        await Promise.all([
            this.audit.log({
                actorId,
                action: 'COMPANY_SUSPENDED',
                entityType: 'Company',
                entityId: id,
                meta: { companyName: company.name },
                companyId: id,
            }),
            this.notifications.sendToCompanyAdmins(id, 'Компания приостановлена', 'Ваша компания была приостановлена администратором платформы.'),
        ]);
        return { ok: true };
    }
    async listPayments(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.companyId)
            where.companyId = query.companyId;
        if (query.from || query.to) {
            where.createdAt = {};
            if (query.from)
                where.createdAt.gte = query.from;
            if (query.to)
                where.createdAt.lte = query.to;
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
        const totalAmount = aggregate._sum.amountUsd?.toNumber() ?? 0;
        const count = aggregate._count._all;
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
};
exports.ProviderService = ProviderService;
exports.ProviderService = ProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], ProviderService);
//# sourceMappingURL=provider.service.js.map