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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const prisma_service_1 = require("../../prisma/prisma.service");
const attendance_service_1 = require("../attendance/attendance.service");
const ABSENT_STATUSES = [shared_1.DayStatus.ABSENT, shared_1.DayStatus.INCOMPLETE];
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async buildReport(query) {
        const from = (0, attendance_service_1.startOfDayUtc)(query.from);
        const to = (0, attendance_service_1.startOfDayUtc)(query.to);
        const where = { date: { gte: from, lte: to } };
        if (query.userId)
            where.userId = query.userId;
        const [records, users] = await Promise.all([
            this.prisma.attendance.findMany({
                where: where,
                select: {
                    userId: true,
                    workedMinutes: true,
                    status: true,
                    checkInAt: true,
                    checkOutAt: true,
                },
            }),
            this.prisma.user.findMany({
                where: { deletedAt: null },
                select: { id: true, fullName: true, email: true },
            }),
        ]);
        const userMap = new Map(users.map((u) => [u.id, { fullName: u.fullName, email: u.email }]));
        const agg = new Map();
        for (const rec of records) {
            if (!agg.has(rec.userId)) {
                agg.set(rec.userId, {
                    totalWorkedMinutes: 0,
                    lateCount: 0,
                    absentCount: 0,
                    approvedAbsenceCount: 0,
                    earliestCheckIn: null,
                    latestCheckOut: null,
                });
            }
            const g = agg.get(rec.userId);
            g.totalWorkedMinutes += rec.workedMinutes ?? 0;
            if (rec.status === shared_1.DayStatus.LATE)
                g.lateCount++;
            if (ABSENT_STATUSES.includes(rec.status))
                g.absentCount++;
            if (rec.status === shared_1.DayStatus.APPROVED_ABSENCE)
                g.approvedAbsenceCount++;
            if (rec.checkInAt) {
                const ci = new Date(rec.checkInAt);
                if (!g.earliestCheckIn || ci < g.earliestCheckIn)
                    g.earliestCheckIn = ci;
            }
            if (rec.checkOutAt) {
                const co = new Date(rec.checkOutAt);
                if (!g.latestCheckOut || co > g.latestCheckOut)
                    g.latestCheckOut = co;
            }
        }
        const rows = [];
        for (const [userId, g] of agg) {
            const user = userMap.get(userId);
            rows.push({
                userId,
                fullName: user?.fullName ?? userId,
                email: user?.email ?? '',
                totalWorkedHours: Math.round((g.totalWorkedMinutes / 60) * 10) / 10,
                lateCount: g.lateCount,
                absentCount: g.absentCount,
                approvedAbsenceCount: g.approvedAbsenceCount,
                earliestCheckIn: g.earliestCheckIn,
                latestCheckOut: g.latestCheckOut,
            });
        }
        rows.sort((a, b) => b.totalWorkedHours - a.totalWorkedHours);
        return rows;
    }
    async buildCsv(query) {
        const rows = await this.buildReport(query);
        const header = 'ФИО,Email,Часы,Опоздания,Пропуски,Пропуски с причиной';
        const lines = rows.map((r) => `"${r.fullName.replace(/"/g, '""')}","${r.email}",${r.totalWorkedHours},${r.lateCount},${r.absentCount},${r.approvedAbsenceCount}`);
        return [header, ...lines].join('\r\n');
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map