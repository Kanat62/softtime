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
exports.AttendanceService = void 0;
exports.startOfDayUtc = startOfDayUtc;
exports.getWeekdayFromDate = getWeekdayFromDate;
exports.calcCheckInStatus = calcCheckInStatus;
exports.calcCheckOutStatus = calcCheckOutStatus;
exports.calcDayStatus = calcDayStatus;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const ip_utils_1 = require("../../common/utils/ip.utils");
const tenant_context_1 = require("../../common/tenant/tenant.context");
const timezone_utils_1 = require("../../common/utils/timezone.utils");
const DEFAULT_TIMEZONE = 'Asia/Bishkek';
const JS_DAY_TO_WEEKDAY = [
    shared_1.Weekday.SUN, shared_1.Weekday.MON, shared_1.Weekday.TUE, shared_1.Weekday.WED,
    shared_1.Weekday.THU, shared_1.Weekday.FRI, shared_1.Weekday.SAT,
];
function startOfDayUtc(d) {
    const out = new Date(d);
    out.setUTCHours(0, 0, 0, 0);
    return out;
}
function getWeekdayFromDate(d) {
    return JS_DAY_TO_WEEKDAY[d.getUTCDay()];
}
function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}
function minutesToUtcDate(base, minutes) {
    const d = startOfDayUtc(base);
    d.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return d;
}
function calcCheckInStatus(nowMinutes, startMinutes) {
    const diff = nowMinutes - startMinutes;
    if (diff < -5)
        return shared_1.CheckInStatus.EARLY_ARRIVAL;
    if (diff <= 5)
        return shared_1.CheckInStatus.ON_TIME;
    return shared_1.CheckInStatus.LATE;
}
function calcCheckOutStatus(nowMinutes, endMinutes) {
    const diff = nowMinutes - endMinutes;
    if (diff < -5)
        return shared_1.CheckOutStatus.LEFT_EARLY;
    if (diff <= 5)
        return shared_1.CheckOutStatus.ON_TIME;
    return shared_1.CheckOutStatus.OVERTIME;
}
function calcDayStatus(checkInStatus, checkOutStatus) {
    if (checkOutStatus === shared_1.CheckOutStatus.OVERTIME)
        return shared_1.DayStatus.OVERTIME;
    if (checkInStatus === shared_1.CheckInStatus.LATE)
        return shared_1.DayStatus.LATE;
    if (checkOutStatus === shared_1.CheckOutStatus.LEFT_EARLY)
        return shared_1.DayStatus.EARLY_LEAVE;
    return shared_1.DayStatus.PRESENT;
}
const ABSENCE_TYPES = [
    shared_1.RequestType.SICK,
    shared_1.RequestType.FAMILY,
    shared_1.RequestType.VACATION,
    shared_1.RequestType.BUSINESS_TRIP,
    shared_1.RequestType.REMOTE,
];
let AttendanceService = class AttendanceService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getCompanyTimezone() {
        const ctx = (0, tenant_context_1.getTenantContext)();
        if (!ctx?.companyId)
            return DEFAULT_TIMEZONE;
        const company = await this.prisma.company.findUnique({
            where: { id: ctx.companyId },
            select: { timezone: true },
        });
        return company?.timezone ?? DEFAULT_TIMEZONE;
    }
    async validateQrAndIp(qrToken, ip) {
        const qr = await this.prisma.qrToken.findFirst({
            where: { token: qrToken, isActive: true },
        });
        if (!qr)
            throw new common_1.BadRequestException('QR недействителен');
        const networks = await this.prisma.officeNetwork.findMany({
            where: {},
            select: { cidr: true },
        });
        if (!(0, ip_utils_1.checkIpInNetworks)(ip, networks))
            throw new common_1.BadRequestException('Вне офисной сети');
    }
    async checkIn(userId, qrToken, ip) {
        const now = new Date();
        await this.validateQrAndIp(qrToken, ip);
        const timezone = await this.getCompanyTimezone();
        const { weekday, minutesInDay } = (0, timezone_utils_1.getLocalDayInfo)(now, timezone);
        const schedule = await this.prisma.employeeSchedule.findFirst({
            where: { userId, weekday },
        });
        if (!schedule?.isWorkingDay || !schedule.startTime) {
            throw new common_1.BadRequestException('Сегодня нерабочий день');
        }
        const startMin = timeToMinutes(schedule.startTime);
        const checkInStatus = calcCheckInStatus(minutesInDay, startMin);
        const diffMinutes = minutesInDay - startMin;
        const today = startOfDayUtc(now);
        const existing = await this.prisma.attendance.findFirst({
            where: { userId, date: today },
        });
        if (existing?.checkInAt) {
            throw new common_1.ConflictException('Приход уже отмечен');
        }
        let record;
        if (existing) {
            record = await this.prisma.attendance.update({
                where: { id: existing.id },
                data: { checkInAt: now, checkInStatus, status: shared_1.DayStatus.PRESENT },
            });
        }
        else {
            record = await this.prisma.attendance.create({
                data: {
                    userId,
                    date: today,
                    checkInAt: now,
                    checkInStatus,
                    status: shared_1.DayStatus.PRESENT,
                },
            });
        }
        const absDiff = Math.abs(diffMinutes);
        let message;
        if (checkInStatus === shared_1.CheckInStatus.ON_TIME)
            message = 'Вовремя';
        else if (checkInStatus === shared_1.CheckInStatus.EARLY_ARRIVAL)
            message = `Пришёл на ${absDiff} мин раньше`;
        else
            message = `Опоздал на ${absDiff} мин`;
        return { record, checkInStatus, diffMinutes, message };
    }
    async checkOut(userId, qrToken, ip) {
        const now = new Date();
        await this.validateQrAndIp(qrToken, ip);
        const today = startOfDayUtc(now);
        const attendance = await this.prisma.attendance.findFirst({
            where: {
                userId,
                date: today,
                checkInAt: { not: null },
                checkOutAt: null,
            },
        });
        if (!attendance)
            throw new common_1.ConflictException('Нет активного прихода для выхода');
        const timezone = await this.getCompanyTimezone();
        const { weekday, minutesInDay } = (0, timezone_utils_1.getLocalDayInfo)(now, timezone);
        const schedule = await this.prisma.employeeSchedule.findFirst({
            where: { userId, weekday },
        });
        if (!schedule?.endTime)
            throw new common_1.BadRequestException('Расписание на сегодня не настроено');
        const approvedEarlyLeave = await this.prisma.absenceRequest.findFirst({
            where: {
                userId,
                type: shared_1.RequestType.EARLY_LEAVE,
                status: shared_1.RequestStatus.APPROVED,
                startDate: today,
            },
        });
        const endMin = timeToMinutes(schedule.endTime);
        let checkOutStatus = calcCheckOutStatus(minutesInDay, endMin);
        if (checkOutStatus === shared_1.CheckOutStatus.LEFT_EARLY && approvedEarlyLeave) {
            checkOutStatus = shared_1.CheckOutStatus.ON_TIME;
        }
        const dayStatus = calcDayStatus(attendance.checkInStatus ?? shared_1.CheckInStatus.ON_TIME, checkOutStatus);
        const workedMinutes = Math.max(0, Math.floor((now.getTime() - attendance.checkInAt.getTime()) / 60_000));
        const updated = await this.prisma.attendance.update({
            where: { id: attendance.id },
            data: { checkOutAt: now, checkOutStatus, workedMinutes, status: dayStatus },
        });
        const diffMin = Math.abs(minutesInDay - endMin);
        let message;
        if (checkOutStatus === shared_1.CheckOutStatus.ON_TIME)
            message = 'Вышел вовремя';
        else if (checkOutStatus === shared_1.CheckOutStatus.LEFT_EARLY)
            message = `Ранний уход на ${diffMin} мин`;
        else
            message = `Переработка ${diffMin} мин`;
        return { record: updated, checkOutStatus, dayStatus, workedMinutes, message };
    }
    async getMyHistory(userId, query) {
        const where = { userId };
        if (query.from)
            where.date = { ...where.date, gte: new Date(query.from) };
        if (query.to)
            where.date = { ...where.date, lte: new Date(query.to) };
        const skip = (query.page - 1) * query.limit;
        const [total, data] = await Promise.all([
            this.prisma.attendance.count({ where: where }),
            this.prisma.attendance.findMany({
                where: where,
                skip,
                take: query.limit,
                orderBy: { date: 'desc' },
            }),
        ]);
        return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
    }
    async getTodayInOffice() {
        const today = startOfDayUtc(new Date());
        return this.prisma.attendance.findMany({
            where: {
                date: today,
                checkInAt: { not: null },
                checkOutAt: null,
            },
            orderBy: { checkInAt: 'asc' },
        });
    }
    async getCompanyAttendance(query) {
        const where = {};
        if (query.from)
            where.date = { ...where.date, gte: new Date(query.from) };
        if (query.to)
            where.date = { ...where.date, lte: new Date(query.to) };
        if (query.userId)
            where.userId = query.userId;
        if (query.status)
            where.status = query.status;
        const skip = (query.page - 1) * query.limit;
        const [total, data] = await Promise.all([
            this.prisma.attendance.count({ where: where }),
            this.prisma.attendance.findMany({
                where: where,
                skip,
                take: query.limit,
                orderBy: { date: 'desc' },
            }),
        ]);
        return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
    }
    async patchAttendance(id, dto, actorId) {
        const existing = await this.prisma.attendance.findFirst({
            where: { id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Запись не найдена');
        const data = { isManual: true };
        if (dto.checkInAt !== undefined)
            data.checkInAt = dto.checkInAt ? new Date(dto.checkInAt) : null;
        if (dto.checkOutAt !== undefined)
            data.checkOutAt = dto.checkOutAt ? new Date(dto.checkOutAt) : null;
        if (dto.status !== undefined)
            data.status = dto.status;
        if (dto.note !== undefined)
            data.note = dto.note;
        const newCheckIn = data.checkInAt !== undefined ? data.checkInAt : existing.checkInAt;
        const newCheckOut = data.checkOutAt !== undefined ? data.checkOutAt : existing.checkOutAt;
        if (newCheckIn && newCheckOut) {
            data.workedMinutes = Math.max(0, Math.floor((newCheckOut.getTime() - newCheckIn.getTime()) / 60_000));
        }
        const updated = await this.prisma.attendance.update({
            where: { id },
            data,
        });
        await this.audit.log({
            actorId,
            action: 'ATTENDANCE_MANUAL_EDIT',
            entityType: 'Attendance',
            entityId: id,
            meta: dto,
        });
        return updated;
    }
    async createManual(dto, actorId) {
        const date = startOfDayUtc(new Date(dto.date));
        const existing = await this.prisma.attendance.findFirst({
            where: { userId: dto.userId, date },
        });
        if (existing)
            throw new common_1.ConflictException('Запись за этот день уже существует');
        const checkInAt = dto.checkInAt ? new Date(dto.checkInAt) : null;
        const checkOutAt = dto.checkOutAt ? new Date(dto.checkOutAt) : null;
        const workedMinutes = checkInAt && checkOutAt
            ? Math.max(0, Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60_000))
            : null;
        const record = await this.prisma.attendance.create({
            data: {
                userId: dto.userId,
                date,
                status: dto.status,
                checkInAt,
                checkOutAt,
                workedMinutes,
                note: dto.note ?? null,
                isManual: true,
            },
        });
        await this.audit.log({
            actorId,
            action: 'ATTENDANCE_MANUAL_CREATE',
            entityType: 'Attendance',
            entityId: record.id,
            meta: { userId: dto.userId, date: dto.date, status: dto.status },
        });
        return record;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map