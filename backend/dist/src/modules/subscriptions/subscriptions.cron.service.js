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
var SubscriptionsCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let SubscriptionsCronService = SubscriptionsCronService_1 = class SubscriptionsCronService {
    constructor(prisma, notifications, configService) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.configService = configService;
        this.logger = new common_1.Logger(SubscriptionsCronService_1.name);
    }
    async checkSubscriptions() {
        const now = new Date();
        const gracePeriodDays = this.configService.get('GRACE_PERIOD_DAYS') ?? 7;
        const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
        const graceCutoff = new Date(now.getTime() - gracePeriodMs);
        const overdueGraceSubs = await this.prisma.subscription.findMany({
            where: {
                status: shared_1.SubStatus.GRACE,
                periodEnd: { lt: graceCutoff },
            },
            select: { id: true, companyId: true },
        });
        if (overdueGraceSubs.length > 0) {
            const ids = overdueGraceSubs.map((s) => s.id);
            const companyIds = overdueGraceSubs.map((s) => s.companyId);
            await Promise.all([
                this.prisma.subscription.updateMany({
                    where: { id: { in: ids } },
                    data: { status: shared_1.SubStatus.EXPIRED },
                }),
                this.prisma.company.updateMany({
                    where: { id: { in: companyIds } },
                    data: { status: shared_1.CompanyStatus.SUSPENDED },
                }),
            ]);
            await Promise.all(companyIds.map((cid) => this.notifications.sendToCompanyAdmins(cid, 'Компания приостановлена', 'Подписка не оплачена. Доступ к системе приостановлен.')));
            this.logger.log(`Suspended ${overdueGraceSubs.length} company(ies) — grace period expired`);
        }
        const expiredSubs = await this.prisma.subscription.findMany({
            where: {
                status: { in: [shared_1.SubStatus.TRIAL, shared_1.SubStatus.ACTIVE] },
                periodEnd: { lt: now },
            },
            select: { id: true, companyId: true },
        });
        if (expiredSubs.length > 0) {
            const ids = expiredSubs.map((s) => s.id);
            const companyIds = expiredSubs.map((s) => s.companyId);
            await this.prisma.subscription.updateMany({
                where: { id: { in: ids } },
                data: { status: shared_1.SubStatus.GRACE },
            });
            await Promise.all(companyIds.map((cid) => this.notifications.sendToCompanyAdmins(cid, 'Подписка истекает', `Оплатите подписку в течение ${gracePeriodDays} дн., иначе доступ будет приостановлен.`)));
            this.logger.log(`Moved ${expiredSubs.length} subscription(s) to GRACE`);
        }
    }
};
exports.SubscriptionsCronService = SubscriptionsCronService;
__decorate([
    (0, schedule_1.Cron)('30 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsCronService.prototype, "checkSubscriptions", null);
exports.SubscriptionsCronService = SubscriptionsCronService = SubscriptionsCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], SubscriptionsCronService);
//# sourceMappingURL=subscriptions.cron.service.js.map