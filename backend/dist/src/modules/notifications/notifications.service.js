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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const firebase_1 = require("../../config/firebase");
const FCM_BATCH_SIZE = 500;
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    onModuleInit() {
        (0, firebase_1.initFirebase)(this.config.get('FCM_PROJECT_ID'), this.config.get('FCM_CLIENT_EMAIL'), this.config.get('FCM_PRIVATE_KEY'));
    }
    async sendToUser(userId, title, body, data) {
        const tokens = await this.prisma.deviceToken.findMany({
            where: { userId },
            select: { id: true, fcmToken: true },
        });
        if (!tokens.length)
            return;
        await this.multicast(tokens, title, body, data);
    }
    async sendToCompany(companyId, role, title, body, data) {
        const userWhere = {
            companyId,
            status: shared_1.UserStatus.ACTIVE,
            deletedAt: null,
        };
        if (role)
            userWhere.role = role;
        const users = await this.prisma.user.findMany({
            where: userWhere,
            select: { id: true },
        });
        if (!users.length)
            return;
        const userIds = users.map((u) => u.id);
        const tokens = await this.prisma.deviceToken.findMany({
            where: { userId: { in: userIds } },
            select: { id: true, fcmToken: true },
        });
        await this.multicast(tokens, title, body, data);
    }
    async sendToCompanyAdmins(companyId, title, body, data) {
        return this.sendToCompany(companyId, 'ADMIN', title, body, data);
    }
    async sendToProviders(title, body, data) {
        const providers = await this.prisma.$queryRaw `
      SELECT id FROM "User" WHERE role = 'PROVIDER' AND "deletedAt" IS NULL
    `;
        if (!providers.length)
            return;
        const tokens = await this.prisma.deviceToken.findMany({
            where: { userId: { in: providers.map((p) => p.id) } },
            select: { id: true, fcmToken: true },
        });
        await this.multicast(tokens, title, body, data);
    }
    async multicast(tokens, title, body, data) {
        if (!tokens.length)
            return;
        const messaging = (0, firebase_1.getMessaging)();
        if (!messaging) {
            this.logger.debug(`[FCM not configured] "${title}" → ${tokens.length} token(s) (stub)`);
            return;
        }
        const staleIds = [];
        for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
            const batch = tokens.slice(i, i + FCM_BATCH_SIZE);
            const response = await messaging.sendEachForMulticast({
                tokens: batch.map((t) => t.fcmToken),
                notification: { title, body },
                ...(data && { data }),
            });
            response.responses.forEach((res, idx) => {
                if (!res.success &&
                    (res.error?.code === 'messaging/registration-token-not-registered' ||
                        res.error?.code === 'messaging/invalid-registration-token')) {
                    staleIds.push(batch[idx].id);
                }
            });
            this.logger.debug(`[FCM] "${title}" — sent ${response.successCount}/${batch.length}, failed ${response.failureCount}`);
        }
        if (staleIds.length > 0) {
            await this.prisma.deviceToken.deleteMany({ where: { id: { in: staleIds } } });
            this.logger.debug(`[FCM] Removed ${staleIds.length} stale token(s)`);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map