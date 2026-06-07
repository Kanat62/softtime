import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  CheckOutStatus,
  CompanyStatus,
  DayStatus,
  RequestStatus,
  RequestType,
  UserStatus,
  Weekday,
} from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { startOfDayUtc } from './attendance.service';
import { getLocalDayInfo, getLocalWeekday, getLocalDateString } from '../../common/utils/timezone.utils';

const DEFAULT_TIMEZONE = 'Asia/Bishkek';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Absence types that mark whole days as approved absence
const ABSENCE_TYPES: RequestType[] = [
  RequestType.SICK,
  RequestType.FAMILY,
  RequestType.VACATION,
  RequestType.BUSINESS_TRIP,
  RequestType.REMOTE,
];

// Cron jobs run outside any HTTP request → no tenant context → all queries are cross-tenant.
// companyId MUST be provided explicitly in any create() call.
@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── §6.3  Auto-close open shifts  (every 15 min) ─────────────────────────

  @Cron('*/15 * * * *')
  async autoCloseShifts(): Promise<void> {
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

    // 1. Only process companies that are ACTIVE or GRACE — include timezone
    const companies = await this.getEligibleCompanies();
    if (!companies.length) return;

    const companyIds = companies.map((c) => c.id);
    const timezoneMap = new Map(companies.map((c) => [c.id, c.timezone]));

    // 2. All open attendance records for eligible companies (one query)
    const openAttendances = await this.prisma.attendance.findMany({
      where: {
        companyId: { in: companyIds },
        checkInAt: { not: null },
        checkOutAt: null,
        date: { gte: twoDaysAgo },
      } as any,
    });
    if (!openAttendances.length) return;

    // 3. Batch-load all relevant schedules (one query)
    const userIds = [...new Set(openAttendances.map((a: any) => a.userId as string))];
    const schedules = await this.prisma.employeeSchedule.findMany({
      where: { userId: { in: userIds } } as any,
      select: {
        userId: true,
        weekday: true,
        endTime: true,
        isWorkingDay: true,
        autoCheckoutBuffer: true,
      },
    });
    // Index by "userId:weekday" for O(1) look-up
    const scheduleMap = new Map(
      (schedules as any[]).map((s) => [`${s.userId}:${s.weekday}`, s]),
    );

    // 4. Evaluate each open record
    type ToClose = { id: string; checkOutAt: Date; workedMinutes: number };
    const toClose: ToClose[] = [];
    const closedByCompany = new Map<string, string[]>(); // companyId → [userId]

    for (const att of openAttendances as any[]) {
      const timezone = timezoneMap.get(att.companyId as string) ?? DEFAULT_TIMEZONE;

      // Compute local weekday of the attendance date.
      // att.date is UTC midnight of the calendar date → add 12 h to land in the
      // local afternoon, which is guaranteed to be the same calendar day for
      // offsets in the UTC-12 to UTC+11 range.
      const noonProxy = new Date(new Date(att.date).getTime() + 12 * 3600_000);
      const weekday: Weekday = getLocalWeekday(noonProxy, timezone);

      const schedule = scheduleMap.get(`${att.userId}:${weekday}`);
      if (!schedule?.endTime || !schedule.isWorkingDay) continue;

      const endMin = timeToMinutes(schedule.endTime);

      // shiftEnd: UTC midnight of att.date → local midnight via getLocalDayInfo →
      // add endMin to get exact UTC timestamp of local shift end.
      const { startOfLocalDay } = getLocalDayInfo(noonProxy, timezone);
      const shiftEnd = new Date(startOfLocalDay.getTime() + endMin * 60_000);

      const threshold = new Date(
        shiftEnd.getTime() + (schedule.autoCheckoutBuffer as number) * 60_000,
      );
      if (now <= threshold) continue;

      const workedMinutes = Math.max(
        0,
        Math.floor((shiftEnd.getTime() - new Date(att.checkInAt).getTime()) / 60_000),
      );
      toClose.push({ id: att.id, checkOutAt: shiftEnd, workedMinutes });

      const list = closedByCompany.get(att.companyId) ?? [];
      list.push(att.userId);
      closedByCompany.set(att.companyId, list);
    }

    if (!toClose.length) return;

    // 5. Bulk update (parallel — each record is independent)
    await Promise.all(
      toClose.map(({ id, checkOutAt, workedMinutes }) =>
        this.prisma.attendance.update({
          where: { id } as any,
          data: {
            checkOutAt,
            checkOutStatus: CheckOutStatus.LEFT_EARLY,
            status: DayStatus.INCOMPLETE,
            workedMinutes,
          },
        }),
      ),
    );

    // 6. Resolve user names for the notification body (one batch query)
    const allClosedUserIds = [
      ...new Set(([] as string[]).concat(...closedByCompany.values())),
    ];
    const usersInfo = await this.prisma.user.findMany({
      where: { id: { in: allClosedUserIds } } as any,
      select: { id: true, fullName: true },
    });
    const nameMap = new Map(
      (usersInfo as any[]).map((u) => [u.id as string, u.fullName as string]),
    );

    // 7. Push notification to each company's ADMIN
    for (const [companyId, uids] of closedByCompany) {
      const names = uids.map((id) => nameMap.get(id) ?? id).join(', ');
      await this.notifications.sendToCompanyAdmins(
        companyId,
        'Незакрытые смены',
        `Сотрудники не закрыли смену: ${names}`,
      );
    }

    this.logger.log(
      `Auto-closed ${toClose.length} shift(s) across ${closedByCompany.size} company(ies)`,
    );
  }

  // ─── §6.4  Calculate ABSENT for previous day  (daily at 01:00 UTC) ────────

  @Cron('0 1 * * *')
  async calculateAbsent(): Promise<void> {
    const companies = await this.getEligibleCompanies();
    if (!companies.length) return;

    const now = new Date();

    // Group companies by timezone to share the "yesterday" calculation
    const byTimezone = new Map<string, string[]>();
    for (const { id, timezone } of companies) {
      const arr = byTimezone.get(timezone) ?? [];
      arr.push(id);
      byTimezone.set(timezone, arr);
    }

    let totalMarked = 0;

    for (const [timezone, companyIds] of byTimezone) {
      // "yesterday" in this timezone:
      // Use (now - 24 h) which, when formatted in the target timezone, gives
      // the correct local "yesterday" date for all offsets (UTC-12 to UTC+14).
      const nowMinus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // UTC midnight of the local "yesterday" calendar date → used for DB queries
      const yesterdayDateStr = getLocalDateString(nowMinus24h, timezone);
      const yesterday = new Date(yesterdayDateStr + 'T00:00:00.000Z');

      // Weekday of yesterday in this timezone
      const weekday: Weekday = getLocalWeekday(nowMinus24h, timezone);

      // 2. All active (non-deleted, non-pending/blocked) users in eligible companies
      const users = await this.prisma.user.findMany({
        where: {
          companyId: { in: companyIds },
          status: { in: [UserStatus.ACTIVE, UserStatus.WARNING] },
          deletedAt: null,
        } as any,
        select: { id: true, companyId: true },
      });
      if (!users.length) continue;

      const userIds = (users as any[]).map((u) => u.id as string);

      // 3. Who had a working-day schedule on that weekday?
      const schedules = await this.prisma.employeeSchedule.findMany({
        where: { userId: { in: userIds }, weekday, isWorkingDay: true } as any,
        select: { userId: true },
      });
      const scheduledSet = new Set((schedules as any[]).map((s) => s.userId as string));

      // 4. Who already has an attendance record for yesterday?
      const existing = await this.prisma.attendance.findMany({
        where: { userId: { in: userIds }, date: yesterday } as any,
        select: { userId: true },
      });
      const presentSet = new Set((existing as any[]).map((a) => a.userId as string));

      // 5. Who has an approved absence covering yesterday?
      const absences = await this.prisma.absenceRequest.findMany({
        where: {
          userId: { in: userIds },
          status: RequestStatus.APPROVED,
          type: { in: ABSENCE_TYPES },
          startDate: { lte: yesterday },
          OR: [{ endDate: null }, { endDate: { gte: yesterday } }],
        } as any,
        select: { userId: true },
      });
      const absenceSet = new Set((absences as any[]).map((a) => a.userId as string));

      // 6. Determine who needs an ABSENT record
      const toMark = (users as any[]).filter(
        (u) =>
          scheduledSet.has(u.id) &&
          !presentSet.has(u.id) &&
          !absenceSet.has(u.id),
      );
      if (!toMark.length) continue;

      // 7. Bulk-create ABSENT records (companyId explicit — no tenant context in cron)
      await this.prisma.attendance.createMany({
        data: toMark.map((u) => ({
          companyId: u.companyId as string,
          userId: u.id as string,
          date: yesterday,
          status: DayStatus.ABSENT,
        })) as any,
        skipDuplicates: true,
      });

      totalMarked += toMark.length;
    }

    if (totalMarked > 0) {
      this.logger.log(`Marked ${totalMarked} record(s) as ABSENT`);
    }
  }

  // ─── Shared helper ─────────────────────────────────────────────────────────

  private async getEligibleCompanies(): Promise<{ id: string; timezone: string }[]> {
    const companies = await this.prisma.company.findMany({
      where: {
        status: { in: [CompanyStatus.ACTIVE, CompanyStatus.GRACE] },
        deletedAt: null,
      },
      select: { id: true, timezone: true },
    });
    return (companies as any[]).map((c) => ({
      id: c.id as string,
      timezone: (c.timezone ?? DEFAULT_TIMEZONE) as string,
    }));
  }
}
