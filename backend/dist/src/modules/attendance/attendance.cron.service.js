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
var AttendanceCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const attendance_service_1 = require("./attendance.service");
function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}
const ABSENCE_TYPES = [
    shared_1.RequestType.SICK,
    shared_1.RequestType.FAMILY,
    shared_1.RequestType.VACATION,
    shared_1.RequestType.BUSINESS_TRIP,
    shared_1.RequestType.REMOTE,
];
let AttendanceCronService = AttendanceCronService_1 = class AttendanceCronService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.logger = new common_1.Logger(AttendanceCronService_1.name);
    }
    async autoCloseShifts() {
        const now = new Date();
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
        const companyIds = await this.getEligibleCompanyIds();
        if (!companyIds.length)
            return;
        const openAttendances = await this.prisma.attendance.findMany({
            where: {
                companyId: { in: companyIds },
                checkInAt: { not: null },
                checkOutAt: null,
                date: { gte: twoDaysAgo },
            },
        });
        if (!openAttendances.length)
            return;
        const userIds = [...new Set(openAttendances.map((a) => a.userId))];
        const schedules = await this.prisma.employeeSchedule.findMany({
            where: { userId: { in: userIds } },
            select: {
                userId: true,
                weekday: true,
                endTime: true,
                isWorkingDay: true,
                autoCheckoutBuffer: true,
            },
        });
        const scheduleMap = new Map(schedules.map((s) => [`${s.userId}:${s.weekday}`, s]));
        const toClose = [];
        const closedByCompany = new Map();
        for (const att of openAttendances) {
            const weekday = (0, attendance_service_1.getWeekdayFromDate)(new Date(att.date));
            const schedule = scheduleMap.get(`${att.userId}:${weekday}`);
            if (!schedule?.endTime || !schedule.isWorkingDay)
                continue;
            const endMin = timeToMinutes(schedule.endTime);
            const shiftEnd = (0, attendance_service_1.startOfDayUtc)(new Date(att.date));
            shiftEnd.setUTCHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
            const threshold = new Date(shiftEnd.getTime() + schedule.autoCheckoutBuffer * 60_000);
            if (now <= threshold)
                continue;
            const workedMinutes = Math.max(0, Math.floor((shiftEnd.getTime() - new Date(att.checkInAt).getTime()) / 60_000));
            toClose.push({ id: att.id, checkOutAt: shiftEnd, workedMinutes });
            const list = closedByCompany.get(att.companyId) ?? [];
            list.push(att.userId);
            closedByCompany.set(att.companyId, list);
        }
        if (!toClose.length)
            return;
        await Promise.all(toClose.map(({ id, checkOutAt, workedMinutes }) => this.prisma.attendance.update({
            where: { id },
            data: {
                checkOutAt,
                checkOutStatus: shared_1.CheckOutStatus.LEFT_EARLY,
                status: shared_1.DayStatus.INCOMPLETE,
                workedMinutes,
            },
        })));
        const allClosedUserIds = [
            ...new Set([].concat(...closedByCompany.values())),
        ];
        const usersInfo = await this.prisma.user.findMany({
            where: { id: { in: allClosedUserIds } },
            select: { id: true, fullName: true },
        });
        const nameMap = new Map(usersInfo.map((u) => [u.id, u.fullName]));
        for (const [companyId, uids] of closedByCompany) {
            const names = uids.map((id) => nameMap.get(id) ?? id).join(', ');
            await this.notifications.sendToCompanyAdmins(companyId, 'Незакрытые смены', `Сотрудники не закрыли смену: ${names}`);
        }
        this.logger.log(`Auto-closed ${toClose.length} shift(s) across ${closedByCompany.size} company(ies)`);
    }
    async calculateAbsent() {
        const yesterday = (0, attendance_service_1.startOfDayUtc)(new Date());
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const weekday = (0, attendance_service_1.getWeekdayFromDate)(yesterday);
        const companyIds = await this.getEligibleCompanyIds();
        if (!companyIds.length)
            return;
        const users = await this.prisma.user.findMany({
            where: {
                companyId: { in: companyIds },
                status: { in: [shared_1.UserStatus.ACTIVE, shared_1.UserStatus.WARNING] },
                deletedAt: null,
            },
            select: { id: true, companyId: true },
        });
        if (!users.length)
            return;
        const userIds = users.map((u) => u.id);
        const schedules = await this.prisma.employeeSchedule.findMany({
            where: { userId: { in: userIds }, weekday, isWorkingDay: true },
            select: { userId: true },
        });
        const scheduledSet = new Set(schedules.map((s) => s.userId));
        const existing = await this.prisma.attendance.findMany({
            where: { userId: { in: userIds }, date: yesterday },
            select: { userId: true },
        });
        const presentSet = new Set(existing.map((a) => a.userId));
        const absences = await this.prisma.absenceRequest.findMany({
            where: {
                userId: { in: userIds },
                status: shared_1.RequestStatus.APPROVED,
                type: { in: ABSENCE_TYPES },
                startDate: { lte: yesterday },
                OR: [{ endDate: null }, { endDate: { gte: yesterday } }],
            },
            select: { userId: true },
        });
        const absenceSet = new Set(absences.map((a) => a.userId));
        const toMark = users.filter((u) => scheduledSet.has(u.id) &&
            !presentSet.has(u.id) &&
            !absenceSet.has(u.id));
        if (!toMark.length)
            return;
        await this.prisma.attendance.createMany({
            data: toMark.map((u) => ({
                companyId: u.companyId,
                userId: u.id,
                date: yesterday,
                status: shared_1.DayStatus.ABSENT,
            })),
            skipDuplicates: true,
        });
        this.logger.log(`Marked ${toMark.length} record(s) as ABSENT for ${yesterday.toISOString().slice(0, 10)}`);
    }
    async getEligibleCompanyIds() {
        const companies = await this.prisma.company.findMany({
            where: {
                status: { in: [shared_1.CompanyStatus.ACTIVE, shared_1.CompanyStatus.GRACE] },
                deletedAt: null,
            },
            select: { id: true },
        });
        return companies.map((c) => c.id);
    }
};
exports.AttendanceCronService = AttendanceCronService;
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "autoCloseShifts", null);
__decorate([
    (0, schedule_1.Cron)('0 1 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "calculateAbsent", null);
exports.AttendanceCronService = AttendanceCronService = AttendanceCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], AttendanceCronService);
//# sourceMappingURL=attendance.cron.service.js.map