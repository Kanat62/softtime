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
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const attendance_service_1 = require("../attendance/attendance.service");
const ABSENCE_DAY_TYPES = [
    shared_1.RequestType.SICK,
    shared_1.RequestType.FAMILY,
    shared_1.RequestType.VACATION,
    shared_1.RequestType.BUSINESS_TRIP,
    shared_1.RequestType.REMOTE,
];
function eachDayInRange(start, end) {
    const days = [];
    const cur = (0, attendance_service_1.startOfDayUtc)(start);
    const last = (0, attendance_service_1.startOfDayUtc)(end);
    while (cur.getTime() <= last.getTime()) {
        days.push(new Date(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
}
const REQUEST_TYPE_LABELS = {
    [shared_1.RequestType.SICK]: 'Больничный',
    [shared_1.RequestType.FAMILY]: 'По семейным обстоятельствам',
    [shared_1.RequestType.VACATION]: 'Отпуск',
    [shared_1.RequestType.BUSINESS_TRIP]: 'Командировка',
    [shared_1.RequestType.REMOTE]: 'Удалённая работа',
    [shared_1.RequestType.LATE_REASON]: 'Причина опоздания',
    [shared_1.RequestType.EARLY_LEAVE]: 'Ранний уход',
    [shared_1.RequestType.OTHER]: 'Прочее',
};
let RequestsService = class RequestsService {
    constructor(prisma, audit, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
    }
    async createRequest(dto, userId, companyId) {
        if (dto.endDate && dto.endDate < dto.startDate) {
            throw new common_1.BadRequestException('endDate не может быть раньше startDate');
        }
        const request = await this.prisma.absenceRequest.create({
            data: {
                userId,
                type: dto.type,
                startDate: dto.startDate,
                endDate: dto.endDate ?? null,
                desiredTime: dto.desiredTime ?? null,
                comment: dto.comment ?? null,
                status: shared_1.RequestStatus.PENDING,
            },
        });
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            select: { fullName: true },
        });
        const label = REQUEST_TYPE_LABELS[dto.type] ?? dto.type;
        await this.notifications.sendToCompanyAdmins(companyId, 'Новая заявка', `Заявка подана: ${label} от ${user?.fullName ?? userId}`);
        return request;
    }
    async getMyRequests(userId, query) {
        const where = { userId };
        if (query.status)
            where.status = query.status;
        const skip = (query.page - 1) * query.limit;
        const [total, data] = await Promise.all([
            this.prisma.absenceRequest.count({ where: where }),
            this.prisma.absenceRequest.findMany({
                where: where,
                skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
    }
    async getCompanyRequests(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.userId)
            where.userId = query.userId;
        const skip = (query.page - 1) * query.limit;
        const [total, data] = await Promise.all([
            this.prisma.absenceRequest.count({ where: where }),
            this.prisma.absenceRequest.findMany({
                where: where,
                skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
    }
    async approveRequest(id, actorId) {
        const request = await this.prisma.absenceRequest.findFirst({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Заявка не найдена');
        if (request.status !== shared_1.RequestStatus.PENDING) {
            throw new common_1.ConflictException('Заявка уже обработана');
        }
        const updated = await this.prisma.absenceRequest.update({
            where: { id },
            data: {
                status: shared_1.RequestStatus.APPROVED,
                decidedBy: actorId,
            },
        });
        if (ABSENCE_DAY_TYPES.includes(request.type)) {
            await this.markApprovedAbsenceDays(request.userId, request.startDate, request.endDate ?? request.startDate);
        }
        await Promise.all([
            this.audit.log({
                actorId,
                action: 'REQUEST_APPROVED',
                entityType: 'AbsenceRequest',
                entityId: id,
                meta: { type: request.type, userId: request.userId },
            }),
            this.notifications.sendToUser(request.userId, 'Заявка одобрена', `Ваша заявка «${REQUEST_TYPE_LABELS[request.type] ?? request.type}» одобрена`),
        ]);
        return updated;
    }
    async rejectRequest(id, actorId, decisionNote) {
        const request = await this.prisma.absenceRequest.findFirst({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Заявка не найдена');
        if (request.status !== shared_1.RequestStatus.PENDING) {
            throw new common_1.ConflictException('Заявка уже обработана');
        }
        const updated = await this.prisma.absenceRequest.update({
            where: { id },
            data: {
                status: shared_1.RequestStatus.REJECTED,
                decidedBy: actorId,
                decisionNote: decisionNote ?? null,
            },
        });
        const reason = decisionNote ? `: ${decisionNote}` : '';
        await Promise.all([
            this.audit.log({
                actorId,
                action: 'REQUEST_REJECTED',
                entityType: 'AbsenceRequest',
                entityId: id,
                meta: { type: request.type, userId: request.userId, decisionNote },
            }),
            this.notifications.sendToUser(request.userId, 'Заявка отклонена', `Ваша заявка «${REQUEST_TYPE_LABELS[request.type] ?? request.type}» отклонена${reason}`),
        ]);
        return updated;
    }
    async markApprovedAbsenceDays(userId, startDate, endDate) {
        const days = eachDayInRange(startDate, endDate);
        const existing = await this.prisma.attendance.findMany({
            where: { userId, date: { in: days } },
            select: { id: true, date: true },
        });
        const existingDateStrs = new Set(existing.map((a) => new Date(a.date).toISOString().slice(0, 10)));
        const missingDays = days.filter((d) => !existingDateStrs.has(d.toISOString().slice(0, 10)));
        await Promise.all([
            ...existing.map((a) => this.prisma.attendance.update({
                where: { id: a.id },
                data: { status: shared_1.DayStatus.APPROVED_ABSENCE },
            })),
            ...(missingDays.length
                ? [
                    this.prisma.attendance.createMany({
                        data: missingDays.map((date) => ({
                            userId,
                            date,
                            status: shared_1.DayStatus.APPROVED_ABSENCE,
                        })),
                        skipDuplicates: true,
                    }),
                ]
                : []),
        ]);
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], RequestsService);
//# sourceMappingURL=requests.service.js.map