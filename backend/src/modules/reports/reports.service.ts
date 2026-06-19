import { Injectable } from '@nestjs/common';
import { DayStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDayUtc } from '../attendance/attendance.service';

const ABSENT_STATUSES: string[] = [DayStatus.ABSENT, DayStatus.INCOMPLETE];

export interface ReportRow {
  userId: string;
  fullName: string;
  email: string;
  totalWorkedHours: number;
  lateCount: number;
  absentCount: number;
  approvedAbsenceCount: number;
  earliestCheckIn: Date | null;
  latestCheckOut: Date | null;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ─── Build aggregated report ───────────────────────────────────────────────────

  async buildReport(query: {
    from: Date;
    to: Date;
    userId?: string;
  }): Promise<ReportRow[]> {
    const from = startOfDayUtc(query.from);
    const to = startOfDayUtc(query.to);

    const where: any = { date: { gte: from, lte: to } };
    if (query.userId) where.userId = query.userId;

    const [records, users] = await Promise.all([
      this.prisma.attendance.findMany({
        where: where as any,
        select: {
          userId: true,
          workedMinutes: true,
          status: true,
          checkInAt: true,
          checkOutAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null } as any,
        select: { id: true, fullName: true, email: true },
      }),
    ]);

    const userMap = new Map(
      (users as any[]).map((u) => [u.id as string, { fullName: u.fullName as string, email: u.email as string }]),
    );

    // ── Aggregate per userId ─────────────────────────────────────────────────

    type Agg = {
      totalWorkedMinutes: number;
      lateCount: number;
      absentCount: number;
      approvedAbsenceCount: number;
      earliestCheckIn: Date | null;
      latestCheckOut: Date | null;
    };

    const agg = new Map<string, Agg>();

    for (const rec of records as any[]) {
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
      const g = agg.get(rec.userId)!;

      g.totalWorkedMinutes += rec.workedMinutes ?? 0;
      if (rec.status === DayStatus.LATE) g.lateCount++;
      if (ABSENT_STATUSES.includes(rec.status)) g.absentCount++;
      if (rec.status === DayStatus.APPROVED_ABSENCE) g.approvedAbsenceCount++;

      if (rec.checkInAt) {
        const ci = new Date(rec.checkInAt);
        if (!g.earliestCheckIn || ci < g.earliestCheckIn) g.earliestCheckIn = ci;
      }
      if (rec.checkOutAt) {
        const co = new Date(rec.checkOutAt);
        if (!g.latestCheckOut || co > g.latestCheckOut) g.latestCheckOut = co;
      }
    }

    // ── Build rows, sort by hours desc ───────────────────────────────────────

    const rows: ReportRow[] = [];
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

  // ─── Generate CSV ─────────────────────────────────────────────────────────────

  async buildCsv(query: { from: Date; to: Date; userId?: string }): Promise<string> {
    const rows = await this.buildReport(query);

    const header = 'ФИО,Email,Часы,Опоздания,Пропуски,Пропуски с причиной';
    const lines = rows.map(
      (r) =>
        `"${r.fullName.replace(/"/g, '""')}","${r.email}",${r.totalWorkedHours},${r.lateCount},${r.absentCount},${r.approvedAbsenceCount}`,
    );

    return [header, ...lines].join('\r\n');
  }

}
