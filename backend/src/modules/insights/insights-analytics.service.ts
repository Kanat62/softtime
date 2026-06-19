import { Injectable } from '@nestjs/common';
import { DayStatus, UserStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDayUtc } from '../attendance/attendance.service';
import type { CompanyAggregates, DayOfWeekStats, InsightResult, Trend, WeekStats } from './types';

const MIN_EMPLOYEES = 3;
const MIN_RECORDS = 7;

const PRESENT_STATUSES: string[] = [
  DayStatus.PRESENT,
  DayStatus.LATE,
  DayStatus.EARLY_LEAVE,
  DayStatus.OVERTIME,
  DayStatus.MANUAL,
  DayStatus.INCOMPLETE,
];

const WEEKDAY_NAMES: Record<number, string> = {
  0: 'ВС', 1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ',
};

function pct(num: number, denom: number): number {
  if (denom === 0) return 0;
  return Math.round((num / denom) * 100 * 10) / 10;
}

function trendDirection(values: number[]): Trend {
  if (values.length < 2) return 'STABLE';
  const first = values.slice(0, Math.ceil(values.length / 2));
  const second = values.slice(Math.floor(values.length / 2));
  const avgFirst = first.reduce((s, v) => s + v, 0) / first.length;
  const avgSecond = second.reduce((s, v) => s + v, 0) / second.length;
  const delta = avgSecond - avgFirst;
  if (delta > 3) return 'IMPROVING';
  if (delta < -3) return 'DECLINING';
  return 'STABLE';
}

@Injectable()
export class InsightsAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async compute(companyId: string, periodDays = 30): Promise<InsightResult> {
    const to = startOfDayUtc(new Date());
    const from = new Date(to.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // ── 1. Active employee count ──────────────────────────────────────────────
    const employeeCount = await this.prisma.user.count({
      where: {
        companyId,
        role: 'WORKER',
        status: { in: [UserStatus.ACTIVE, UserStatus.WARNING] as any[] },
        deletedAt: null,
      } as any,
    });

    // ── 2. All attendance records for the period ──────────────────────────────
    const records = await this.prisma.attendance.findMany({
      where: {
        companyId,
        date: { gte: from, lt: to },
      } as any,
      select: {
        date: true,
        status: true,
        checkInAt: true,
        userId: true,
      },
    });

    if (employeeCount < MIN_EMPLOYEES || records.length < MIN_RECORDS) {
      return {
        enough: false,
        reason: `Недостаточно данных: сотрудников ${employeeCount} (минимум ${MIN_EMPLOYEES}), записей посещаемости ${records.length} (минимум ${MIN_RECORDS}).`,
      };
    }

    // ── 3. Employee schedules (for lateness calculation) ─────────────────────
    const schedules = await this.prisma.employeeSchedule.findMany({
      where: { companyId } as any,
      select: { userId: true, weekday: true, startTime: true },
    });
    // index: userId:weekday → startTime
    const schedMap = new Map<string, string>();
    for (const s of schedules as any[]) {
      if (s.startTime) schedMap.set(`${s.userId}:${s.weekday}`, s.startTime);
    }

    const JS_WEEKDAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

    // ── 4. Aggregate ──────────────────────────────────────────────────────────
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let totalLateMinutes = 0;
    let lateWithSchedule = 0;

    // day-of-week buckets: 0=SUN … 6=SAT
    const dayBuckets: Record<number, { present: number; total: number; late: number }> = {};
    for (let i = 0; i < 7; i++) dayBuckets[i] = { present: 0, total: 0, late: 0 };

    // weekly buckets (group by ISO week start)
    const weekBuckets = new Map<string, { present: number; total: number; late: number }>();

    for (const rec of records as any[]) {
      const date = new Date(rec.date as Date);
      const dow = date.getUTCDay();
      const weekStart = new Date(date);
      weekStart.setUTCDate(date.getUTCDate() - ((dow + 6) % 7)); // Monday-based
      const weekKey = weekStart.toISOString().slice(0, 10);

      if (!weekBuckets.has(weekKey)) weekBuckets.set(weekKey, { present: 0, total: 0, late: 0 });
      const wb = weekBuckets.get(weekKey)!;

      const isPresent = PRESENT_STATUSES.includes(rec.status as string);
      const isAbsent = rec.status === DayStatus.ABSENT;
      const isLate = rec.status === DayStatus.LATE;

      dayBuckets[dow].total++;
      wb.total++;

      if (isPresent) {
        presentCount++;
        dayBuckets[dow].present++;
        wb.present++;
      }
      if (isAbsent) absentCount++;
      if (isLate) {
        lateCount++;
        dayBuckets[dow].late++;
        wb.late++;
        // Calculate actual late minutes from checkInAt vs schedule
        if (rec.checkInAt) {
          const weekdayName = JS_WEEKDAY_NAMES[dow];
          const startTime = schedMap.get(`${rec.userId}:${weekdayName}`);
          if (startTime) {
            const [sh, sm] = startTime.split(':').map(Number);
            const scheduledMin = sh * 60 + sm;
            const ci = new Date(rec.checkInAt as Date);
            const actualMin = ci.getUTCHours() * 60 + ci.getUTCMinutes();
            const diff = actualMin - scheduledMin;
            if (diff > 0) {
              totalLateMinutes += diff;
              lateWithSchedule++;
            }
          }
        }
      }
    }

    const totalRecords = presentCount + absentCount;
    const attendanceRate = pct(presentCount, totalRecords);
    const punctualityRate = pct(presentCount - lateCount, presentCount);
    const avgLateMinutes = lateWithSchedule > 0 ? Math.round(totalLateMinutes / lateWithSchedule) : 0;

    // ── 5. Day-of-week breakdown ──────────────────────────────────────────────
    const dayBreakdown: DayOfWeekStats[] = [];
    for (let i = 1; i <= 5; i++) { // Mon–Fri
      const b = dayBuckets[i];
      if (b.total < 2) continue;
      dayBreakdown.push({
        weekday: WEEKDAY_NAMES[i],
        attendanceRate: pct(b.present, b.total),
        punctualityRate: pct(b.present - b.late, b.present),
        sampleSize: b.total,
      });
    }

    const worstWeekday = dayBreakdown.length
      ? dayBreakdown.reduce((a, b) => (a.attendanceRate < b.attendanceRate ? a : b)).weekday
      : null;
    const bestWeekday = dayBreakdown.length
      ? dayBreakdown.reduce((a, b) => (a.attendanceRate > b.attendanceRate ? a : b)).weekday
      : null;

    // ── 6. Weekly trend (last 4 weeks, sorted) ────────────────────────────────
    const sortedWeeks = Array.from(weekBuckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-4);

    const weeklyTrend: WeekStats[] = sortedWeeks.map(([key, b]) => ({
      weekLabel: key,
      attendanceRate: pct(b.present, b.total),
      punctualityRate: pct(b.present - b.late, b.present),
    }));

    const attendanceTrend: Trend = trendDirection(weeklyTrend.map((w) => w.attendanceRate));
    const punctualityTrend: Trend = trendDirection(weeklyTrend.map((w) => w.punctualityRate));

    const aggregates: CompanyAggregates = {
      periodFrom: from.toISOString().slice(0, 10),
      periodTo: to.toISOString().slice(0, 10),
      periodDays,
      employeeCount,
      totalScheduledRecords: totalRecords,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      punctualityRate,
      avgLateMinutes,
      worstWeekday,
      bestWeekday,
      dayBreakdown,
      weeklyTrend,
      attendanceTrend,
      punctualityTrend,
    };

    return { enough: true, aggregates };
  }
}
