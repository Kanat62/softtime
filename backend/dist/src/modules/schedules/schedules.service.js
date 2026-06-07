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
exports.SchedulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const WEEKDAY_ORDER = {
    MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6,
};
function sortByWeekday(rows) {
    return [...rows].sort((a, b) => WEEKDAY_ORDER[a.weekday] - WEEKDAY_ORDER[b.weekday]);
}
function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}
function toScheduleData(day, userId) {
    return {
        userId,
        weekday: day.weekday,
        isWorkingDay: day.isWorkingDay,
        startTime: day.startTime ?? null,
        endTime: day.endTime ?? null,
        autoCheckoutBuffer: day.autoCheckoutBuffer,
    };
}
let SchedulesService = class SchedulesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getMySchedule(userId) {
        const rows = await this.prisma.employeeSchedule.findMany({
            where: { userId },
        });
        return sortByWeekday(rows);
    }
    async getUserSchedule(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { id: true },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        const rows = await this.prisma.employeeSchedule.findMany({
            where: { userId },
        });
        return sortByWeekday(rows);
    }
    async saveSchedule(userId, days, actorId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { id: true },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        await this.validateMinHours(days);
        await this.prisma.employeeSchedule.deleteMany({ where: { userId } });
        await this.prisma.employeeSchedule.createMany({
            data: days.map((d) => toScheduleData(d, userId)),
        });
        await this.audit.log({
            actorId,
            action: 'SCHEDULE_UPDATED',
            entityType: 'EmployeeSchedule',
            entityId: userId,
            meta: { userId },
        });
        const rows = await this.prisma.employeeSchedule.findMany({
            where: { userId },
        });
        return sortByWeekday(rows);
    }
    async applyAll(days, actorId, userIds) {
        await this.validateMinHours(days);
        const userWhere = { deletedAt: null };
        if (userIds?.length)
            userWhere.id = { in: userIds };
        const users = await this.prisma.user.findMany({
            where: userWhere,
            select: { id: true },
        });
        if (!users.length)
            return { applied: 0 };
        const targetIds = users.map((u) => u.id);
        await this.prisma.employeeSchedule.deleteMany({
            where: { userId: { in: targetIds } },
        });
        await this.prisma.employeeSchedule.createMany({
            data: targetIds.flatMap((uid) => days.map((d) => toScheduleData(d, uid))),
        });
        await this.audit.log({
            actorId,
            action: 'SCHEDULE_APPLY_ALL',
            entityType: 'EmployeeSchedule',
            meta: { applied: targetIds.length, subset: !!userIds?.length },
        });
        return { applied: targetIds.length };
    }
    async validateMinHours(days) {
        const settings = await this.prisma.workSettings.findFirst({ where: {} });
        const minMinutes = (settings?.minWorkdayHours ?? 6) * 60;
        for (const day of days) {
            if (!day.isWorkingDay || !day.startTime || !day.endTime)
                continue;
            const duration = timeToMinutes(day.endTime) - timeToMinutes(day.startTime);
            if (duration < minMinutes) {
                const minHours = minMinutes / 60;
                throw new common_1.UnprocessableEntityException(`${day.weekday}: рабочий день должен быть не менее ${minHours} ч (${day.startTime}–${day.endTime})`);
            }
        }
    }
};
exports.SchedulesService = SchedulesService;
exports.SchedulesService = SchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SchedulesService);
//# sourceMappingURL=schedules.service.js.map