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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const payment_provider_interface_1 = require("../../common/interfaces/payment-provider.interface");
const SUBSCRIPTION_PERIOD_DAYS = 30;
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma, audit, notifications, paymentProvider) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
        this.paymentProvider = paymentProvider;
    }
    async getMySubscription(companyId) {
        const sub = await this.prisma.subscription.findUnique({
            where: { companyId },
        });
        if (!sub)
            throw new common_1.NotFoundException('Подписка не найдена');
        const now = Date.now();
        const daysLeft = Math.max(0, Math.ceil((sub.periodEnd.getTime() - now) / (1000 * 60 * 60 * 24)));
        return { ...sub, daysLeft };
    }
    async initiatePayment(companyId) {
        const sub = await this.prisma.subscription.findUnique({ where: { companyId } });
        if (!sub)
            throw new common_1.NotFoundException('Подписка не найдена');
        if (sub.status === shared_1.SubStatus.CANCELLED) {
            throw new common_1.ConflictException('Подписка отменена. Обратитесь в службу поддержки.');
        }
        const checkoutUrl = await this.paymentProvider.createCheckout(30, companyId);
        return { checkoutUrl };
    }
    async cancelSubscription(companyId, actorId) {
        const sub = await this.prisma.subscription.findUnique({ where: { companyId } });
        if (!sub)
            throw new common_1.NotFoundException('Подписка не найдена');
        if (sub.status === shared_1.SubStatus.CANCELLED) {
            throw new common_1.ConflictException('Подписка уже отменена');
        }
        const [updatedSub] = await Promise.all([
            this.prisma.subscription.update({
                where: { companyId },
                data: { status: shared_1.SubStatus.CANCELLED },
            }),
            this.prisma.company.update({
                where: { id: companyId },
                data: { status: shared_1.CompanyStatus.SUSPENDED },
            }),
        ]);
        await Promise.all([
            this.audit.log({
                actorId,
                action: 'SUBSCRIPTION_CANCELLED',
                entityType: 'Subscription',
                entityId: sub.id,
                meta: { companyId },
            }),
            this.notifications.sendToCompanyAdmins(companyId, 'Подписка отменена', 'Ваша подписка была отменена. Доступ к системе приостановлен.'),
        ]);
        return updatedSub;
    }
    async getPayments(companyId, query) {
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
    async handleWebhook(payload, signature) {
        const valid = this.paymentProvider.verifyWebhook(payload, signature);
        if (!valid)
            return { ok: false, reason: 'invalid_signature' };
        if (payload.status !== 'success') {
            return { ok: false, reason: 'non_success_status' };
        }
        const { companyId } = payload;
        const sub = await this.prisma.subscription.findUnique({ where: { companyId } });
        if (!sub)
            return { ok: false, reason: 'subscription_not_found' };
        const now = new Date();
        const periodEnd = new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000);
        await Promise.all([
            this.prisma.payment.create({
                data: {
                    companyId,
                    subscriptionId: sub.id,
                    amountUsd: payload.amount ?? 30,
                    periodStart: now,
                    periodEnd,
                    status: shared_1.PaymentStatus.PAID,
                    provider: 'mock',
                    providerRef: payload.providerRef ?? null,
                },
            }),
            this.prisma.subscription.update({
                where: { companyId },
                data: {
                    status: shared_1.SubStatus.ACTIVE,
                    periodStart: now,
                    periodEnd,
                    nextBillingAt: periodEnd,
                },
            }),
            this.prisma.company.update({
                where: { id: companyId },
                data: { status: shared_1.CompanyStatus.ACTIVE },
            }),
        ]);
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true },
        });
        await this.notifications.sendToProviders('Поступила оплата', `Поступила оплата от компании «${company?.name ?? companyId}»`);
        return { ok: true };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(payment_provider_interface_1.PAYMENT_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService, Object])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map