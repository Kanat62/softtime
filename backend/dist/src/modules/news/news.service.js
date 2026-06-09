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
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
let NewsService = class NewsService {
    constructor(prisma, notifications, audit) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.audit = audit;
    }
    async getFeed(query) {
        const skip = (query.page - 1) * query.limit;
        const [total, data] = await Promise.all([
            this.prisma.news.count({ where: {} }),
            this.prisma.news.findMany({
                where: {},
                skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return {
            data,
            meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) },
        };
    }
    async getNews(id, userId) {
        const news = await this.prisma.news.findFirst({
            where: { id },
            include: { reads: { where: { userId }, take: 1 } },
        });
        if (!news)
            throw new common_1.NotFoundException('Новость не найдена');
        if (!news.reads?.length) {
            await this.prisma.newsRead.upsert({
                where: { newsId_userId: { newsId: id, userId } },
                create: { newsId: id, userId },
                update: {},
            });
        }
        const { reads: _, ...newsData } = news;
        return newsData;
    }
    async markRead(newsId, userId) {
        const news = await this.prisma.news.findFirst({ where: { id: newsId } });
        if (!news)
            throw new common_1.NotFoundException('Новость не найдена');
        await this.prisma.newsRead.upsert({
            where: { newsId_userId: { newsId, userId } },
            create: { newsId, userId },
            update: {},
        });
        return { ok: true };
    }
    async createNews(dto, adminId) {
        const news = await this.prisma.news.create({
            data: {
                title: dto.title,
                body: dto.body,
                photoUrl: dto.photoUrl ?? null,
                createdBy: adminId,
            },
        });
        const activeUsers = await this.prisma.user.findMany({
            where: { status: shared_1.UserStatus.ACTIVE, deletedAt: null },
            select: { id: true },
        });
        await Promise.all([
            ...activeUsers.map((u) => this.notifications.sendToUser(u.id, 'Новая новость', `${dto.title}`)),
            this.audit.log({
                actorId: adminId,
                action: 'NEWS_CREATED',
                entityType: 'News',
                entityId: news.id,
                meta: { title: dto.title },
            }),
        ]);
        return news;
    }
    async getReadStats(newsId) {
        const news = await this.prisma.news.findFirst({ where: { id: newsId } });
        if (!news)
            throw new common_1.NotFoundException('Новость не найдена');
        const [users, reads] = await Promise.all([
            this.prisma.user.findMany({
                where: { deletedAt: null },
                select: { id: true, fullName: true, email: true },
            }),
            this.prisma.newsRead.findMany({
                where: { newsId },
                select: { userId: true, readAt: true },
            }),
        ]);
        const readMap = new Map(reads.map((r) => [r.userId, r.readAt]));
        const readList = users
            .filter((u) => readMap.has(u.id))
            .map((u) => ({ userId: u.id, fullName: u.fullName, email: u.email, readAt: readMap.get(u.id) }));
        const unreadList = users
            .filter((u) => !readMap.has(u.id))
            .map((u) => ({ userId: u.id, fullName: u.fullName, email: u.email }));
        return {
            stats: {
                total: users.length,
                readCount: readList.length,
                unreadCount: unreadList.length,
            },
            read: readList,
            unread: unreadList,
        };
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], NewsService);
//# sourceMappingURL=news.service.js.map