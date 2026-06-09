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
const timezone_utils_1 = require("../../common/utils/timezone.utils");
const DEFAULT_TIMEZONE = 'Asia/Bishkek';
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
        const companies = await this.getEligibleCompanies();
        if (!companies.length)
            return;
        const companyIds = companies.map((c) => c.id);
        const timezoneMap = new Map(companies.map((c) => [c.id, c.timezone]));
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
            const timezone = timezoneMap.get(att.companyId) ?? DEFAULT_TIMEZONE;
            const noonProxy = new Date(new Date(att.date).getTime() + 12 * 3600_000);
            const weekday = (0, timezone_utils_1.getLocalWeekday)(noonProxy, timezone);
            const schedule = scheduleMap.get(`${att.userId}:${weekday}`);
            if (!schedule?.endTime || !schedule.isWorkingDay)
                continue;
            const endMin = timeToMinutes(schedule.endTime);
            const { startOfLocalDay } = (0, timezone_utils_1.getLocalDayInfo)(noonProxy, timezone);
            const shiftEnd = new Date(startOfLocalDay.getTime() + endMin * 60_000);
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
        const companies = await this.getEligibleCompanies();
        if (!companies.length)
            return;
        const now = new Date();
        const byTimezone = new Map();
        for (const { id, timezone } of companies) {
            const arr = byTimezone.get(timezone) ?? [];
            arr.push(id);
            byTimezone.set(timezone, arr);
        }
        let totalMarked = 0;
        for (const [timezone, companyIds] of byTimezone) {
            const nowMinus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayDateStr = (0, timezone_utils_1.getLocalDateString)(nowMinus24h, timezone);
            const yesterday = new Date(yesterdayDateStr + 'T00:00:00.000Z');
            const weekday = (0, timezone_utils_1.getLocalWeekday)(nowMinus24h, timezone);
            const users = await this.prisma.user.findMany({
                where: {
                    companyId: { in: companyIds },
                    status: { in: [shared_1.UserStatus.ACTIVE, shared_1.UserStatus.WARNING] },
                    deletedAt: null,
                },
                select: { id: true, companyId: true },
            });
            if (!users.length)
                continue;
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
                continue;
            await this.prisma.attendance.createMany({
                data: toMark.map((u) => ({
                    companyId: u.companyId,
                    userId: u.id,
                    date: yesterday,
                    status: shared_1.DayStatus.ABSENT,
                })),
                skipDuplicates: true,
            });
            totalMarked += toMark.length;
        }
        if (totalMarked > 0) {
            this.logger.log(`Marked ${totalMarked} record(s) as ABSENT`);
        }
    }
    async getEligibleCompanies() {
        const companies = await this.prisma.company.findMany({
            where: {
                status: { in: [shared_1.CompanyStatus.ACTIVE, shared_1.CompanyStatus.GRACE] },
                deletedAt: null,
            },
            select: { id: true, timezone: true },
        });
        return companies.map((c) => ({
            id: c.id,
            timezone: (c.timezone ?? DEFAULT_TIMEZONE),
        }));
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