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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const BCRYPT_ROUNDS = 12;
const USER_SELECT = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    status: true,
    avatarUrl: true,
    hiredAt: true,
    adminNote: true,
    createdAt: true,
    companyId: true,
};
let UsersService = class UsersService {
    constructor(prisma, audit, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
    }
    async listUsers(query) {
        const { status, search, page, limit } = query;
        const where = { deletedAt: null };
        if (status)
            where['status'] = status;
        if (search) {
            where['OR'] = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [total, users] = await Promise.all([
            this.prisma.user.count({ where: where }),
            this.prisma.user.findMany({
                where: where,
                skip,
                take: limit,
                select: USER_SELECT,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return {
            data: users,
            meta: { total, page, limit, pages: Math.ceil(total / limit) },
        };
    }
    async getUser(id) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: USER_SELECT,
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        const [attendance, requests] = await Promise.all([
            this.prisma.attendance.findMany({
                where: { userId: id },
                orderBy: { date: 'desc' },
                take: 50,
            }),
            this.prisma.absenceRequest.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return { user, attendance, requests };
    }
    async approveUser(id, actorId) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        if (user.status !== shared_1.UserStatus.PENDING) {
            throw new common_1.BadRequestException('Пользователь не в статусе PENDING');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: shared_1.UserStatus.ACTIVE },
            select: USER_SELECT,
        });
        await Promise.all([
            this.audit.log({
                actorId,
                action: 'USER_APPROVED',
                entityType: 'User',
                entityId: id,
                meta: { previousStatus: shared_1.UserStatus.PENDING },
            }),
            this.notifications.sendToUser(id, 'Регистрация одобрена', 'Ваша регистрация в компании одобрена'),
        ]);
        return updated;
    }
    async rejectUser(id, actorId) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        if (user.status !== shared_1.UserStatus.PENDING) {
            throw new common_1.BadRequestException('Пользователь не в статусе PENDING');
        }
        await this.prisma.user.update({
            where: { id },
            data: { status: shared_1.UserStatus.DELETED, deletedAt: new Date() },
        });
        await Promise.all([
            this.audit.log({
                actorId,
                action: 'USER_REJECTED',
                entityType: 'User',
                entityId: id,
            }),
            this.notifications.sendToUser(id, 'Регистрация отклонена', 'Ваша заявка на регистрацию была отклонена'),
        ]);
    }
    async setUserStatus(id, status, actorId) {
        const allowed = [
            shared_1.UserStatus.ACTIVE,
            shared_1.UserStatus.BLOCKED,
            shared_1.UserStatus.WARNING,
        ];
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException('Допустимые статусы: ACTIVE, BLOCKED, WARNING');
        }
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status },
            select: USER_SELECT,
        });
        await this.audit.log({
            actorId,
            action: 'USER_STATUS_CHANGED',
            entityType: 'User',
            entityId: id,
            meta: { previousStatus: user.status, newStatus: status },
        });
        return updated;
    }
    async setAdminNote(id, note, actorId) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        const updated = await this.prisma.user.update({
            where: { id },
            data: { adminNote: note },
            select: USER_SELECT,
        });
        await this.audit.log({
            actorId,
            action: 'USER_NOTE_UPDATED',
            entityType: 'User',
            entityId: id,
        });
        return updated;
    }
    async deleteUser(id, actorId) {
        if (id === actorId) {
            throw new common_1.ForbiddenException('Нельзя удалить собственный аккаунт');
        }
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        await this.prisma.user.update({
            where: { id },
            data: { status: shared_1.UserStatus.DELETED, deletedAt: new Date() },
        });
        await this.audit.log({
            actorId,
            action: 'USER_DELETED',
            entityType: 'User',
            entityId: id,
            meta: { previousStatus: user.status },
        });
    }
    async getMyProfile(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: USER_SELECT,
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        return user;
    }
    async updateMyProfile(userId, dto) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        const data = {};
        if (dto.avatarUrl !== undefined) {
            data['avatarUrl'] = dto.avatarUrl;
        }
        if (dto.newPassword) {
            if (!dto.currentPassword) {
                throw new common_1.BadRequestException('currentPassword обязателен для смены пароля');
            }
            const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
            if (!isMatch) {
                throw new common_1.UnauthorizedException('Текущий пароль неверен');
            }
            data['passwordHash'] = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        }
        if (Object.keys(data).length === 0) {
            throw new common_1.BadRequestException('Нет данных для обновления');
        }
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: USER_SELECT,
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], UsersService);
//# sourceMappingURL=users.service.js.map