import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  CheckInStatus,
  CheckOutStatus,
  DayStatus,
  RequestStatus,
  RequestType,
  UserStatus,
  Weekday,
} from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { checkIpInNetworks } from '../../common/utils/ip.utils';
import { getTenantContext } from '../../common/tenant/tenant.context';
import { getLocalDayInfo } from '../../common/utils/timezone.utils';

const DEFAULT_TIMEZONE = 'Asia/Bishkek';

// ─── Date / time helpers ──────────────────────────────────────────────────────

const JS_DAY_TO_WEEKDAY: Weekday[] = [
  Weekday.SUN, Weekday.MON, Weekday.TUE, Weekday.WED,
  Weekday.THU, Weekday.FRI, Weekday.SAT,
];

export function startOfDayUtc(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export function getWeekdayFromDate(d: Date): Weekday {
  return JS_DAY_TO_WEEKDAY[d.getUTCDay()];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToUtcDate(base: Date, minutes: number): Date {
  const d = startOfDayUtc(base);
  d.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

// ─── Status calculators ───────────────────────────────────────────────────────

export function calcCheckInStatus(nowMinutes: number, startMinutes: number): CheckInStatus {
  const diff = nowMinutes - startMinutes;
  if (diff < -5) return CheckInStatus.EARLY_ARRIVAL;
  if (diff <= 5) return CheckInStatus.ON_TIME;
  return CheckInStatus.LATE;
}

export function calcCheckOutStatus(nowMinutes: number, endMinutes: number): CheckOutStatus {
  const diff = nowMinutes - endMinutes;
  if (diff < -5) return CheckOutStatus.LEFT_EARLY;
  if (diff <= 5) return CheckOutStatus.ON_TIME;
  return CheckOutStatus.OVERTIME;
}

// Accepts plain strings — Prisma-generated enums and @softtime/shared enums
// share the same values but are distinct TypeScript types.
export function calcDayStatus(checkInStatus: string, checkOutStatus: string): DayStatus {
  if (checkOutStatus === CheckOutStatus.OVERTIME) return DayStatus.OVERTIME;
  if (checkInStatus === CheckInStatus.LATE) return DayStatus.LATE;
  if (checkOutStatus === CheckOutStatus.LEFT_EARLY) return DayStatus.EARLY_LEAVE;
  return DayStatus.PRESENT;
}

// ─── Absence request types that cover full day absences ───────────────────────

const ABSENCE_TYPES: RequestType[] = [
  RequestType.SICK,
  RequestType.FAMILY,
  RequestType.VACATION,
  RequestType.BUSINESS_TRIP,
  RequestType.REMOTE,
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Company timezone lookup ────────────────────────────────────────────────

  private async getCompanyTimezone(): Promise<string> {
    const ctx = getTenantContext();
    if (!ctx?.companyId) return DEFAULT_TIMEZONE;
    const company = await this.prisma.company.findUnique({
      where: { id: ctx.companyId },
      select: { timezone: true },
    });
    return (company as any)?.timezone ?? DEFAULT_TIMEZONE;
  }

  // ─── Shared: validate QR token + IP ────────────────────────────────────────

  private async validateQrAndIp(qrToken: string, ip: string): Promise<void> {
    // 2. QR validation — tenant extension scopes by companyId automatically
    const qr = await this.prisma.qrToken.findFirst({
      where: { token: qrToken, isActive: true } as any,
    });
    if (!qr) throw new BadRequestException('QR недействителен');

    // 3. IP validation
    const networks = await this.prisma.officeNetwork.findMany({
      where: {} as any,
      select: { cidr: true },
    });
    if (!checkIpInNetworks(ip, networks as any)) throw new BadRequestException('Вне офисной сети');
  }

  // ─── Check-in ───────────────────────────────────────────────────────────────

  async checkIn(userId: string, qrToken: string, ip: string) {
    const now = new Date();
    await this.validateQrAndIp(qrToken, ip);

    // 4. Schedule for today — use company's local timezone for weekday
    const timezone = await this.getCompanyTimezone();
    const { weekday, minutesInDay } = getLocalDayInfo(now, timezone);
    const schedule = await this.prisma.employeeSchedule.findFirst({
      where: { userId, weekday } as any,
    });
    if (!schedule?.isWorkingDay || !schedule.startTime) {
      throw new BadRequestException('Сегодня нерабочий день');
    }

    // 5. Status calculation — compare local minutes, not UTC
    const startMin = timeToMinutes(schedule.startTime);
    const checkInStatus = calcCheckInStatus(minutesInDay, startMin);
    const diffMinutes = minutesInDay - startMin;

    // 6. Upsert (guard against duplicate check-in)
    const today = startOfDayUtc(now);
    const existing = await this.prisma.attendance.findFirst({
      where: { userId, date: today } as any,
    });
    if (existing?.checkInAt) {
      throw new ConflictException('Приход уже отмечен');
    }

    let record: any;
    if (existing) {
      record = await this.prisma.attendance.update({
        where: { id: existing.id } as any,
        data: { checkInAt: now, checkInStatus, status: DayStatus.PRESENT },
      });
    } else {
      record = await this.prisma.attendance.create({
        data: {
          userId,
          date: today,
          checkInAt: now,
          checkInStatus,
          status: DayStatus.PRESENT,
        } as any,
      });
    }

    // 7. Human-readable diff
    const absDiff = Math.abs(diffMinutes);
    let message: string;
    if (checkInStatus === CheckInStatus.ON_TIME) message = 'Вовремя';
    else if (checkInStatus === CheckInStatus.EARLY_ARRIVAL) message = `Пришёл на ${absDiff} мин раньше`;
    else message = `Опоздал на ${absDiff} мин`;

    return { record, checkInStatus, diffMinutes, message };
  }

  // ─── Check-out ──────────────────────────────────────────────────────────────

  async checkOut(userId: string, qrToken: string, ip: string) {
    const now = new Date();
    await this.validateQrAndIp(qrToken, ip);

    // 2. Find today's open attendance — date stored as UTC midnight
    const today = startOfDayUtc(now);
    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        date: today,
        checkInAt: { not: null },
        checkOutAt: null,
      } as any,
    });
    if (!attendance) throw new ConflictException('Нет активного прихода для выхода');

    // Schedule for today — use company's local timezone for weekday
    const timezone = await this.getCompanyTimezone();
    const { weekday, minutesInDay } = getLocalDayInfo(now, timezone);
    const schedule = await this.prisma.employeeSchedule.findFirst({
      where: { userId, weekday } as any,
    });
    if (!schedule?.endTime) throw new BadRequestException('Расписание на сегодня не настроено');

    // 3. Check for approved EARLY_LEAVE request today
    const approvedEarlyLeave = await this.prisma.absenceRequest.findFirst({
      where: {
        userId,
        type: RequestType.EARLY_LEAVE,
        status: RequestStatus.APPROVED,
        startDate: today,
      } as any,
    });

    // 4. Status calculation — compare local minutes, not UTC
    const endMin = timeToMinutes(schedule.endTime);
    let checkOutStatus = calcCheckOutStatus(minutesInDay, endMin);

    // If approved early leave → don't penalise (use ON_TIME status)
    if (checkOutStatus === CheckOutStatus.LEFT_EARLY && approvedEarlyLeave) {
      checkOutStatus = CheckOutStatus.ON_TIME;
    }

    const dayStatus = calcDayStatus(
      attendance.checkInStatus ?? CheckInStatus.ON_TIME,
      checkOutStatus,
    );

    const workedMinutes = Math.max(
      0,
      Math.floor((now.getTime() - attendance.checkInAt!.getTime()) / 60_000),
    );

    // 5. Persist
    const updated = await this.prisma.attendance.update({
      where: { id: attendance.id } as any,
      data: { checkOutAt: now, checkOutStatus, workedMinutes, status: dayStatus },
    });

    const diffMin = Math.abs(minutesInDay - endMin);
    let message: string;
    if (checkOutStatus === CheckOutStatus.ON_TIME) message = 'Вышел вовремя';
    else if (checkOutStatus === CheckOutStatus.LEFT_EARLY) message = `Ранний уход на ${diffMin} мин`;
    else message = `Переработка ${diffMin} мин`;

    return { record: updated, checkOutStatus, dayStatus, workedMinutes, message };
  }

  // ─── Clear today (DEV) ──────────────────────────────────────────────────────

  async clearToday(userId: string): Promise<void> {
    const today = startOfDayUtc(new Date());
    await this.prisma.attendance.deleteMany({
      where: { userId, date: today } as any,
    });
  }

  // ─── My history ─────────────────────────────────────────────────────────────

  async getMyHistory(
    userId: string,
    query: { from?: string; to?: string; page: number; limit: number },
  ) {
    const where: any = { userId };
    if (query.from) where.date = { ...where.date, gte: new Date(query.from) };
    if (query.to) where.date = { ...where.date, lte: new Date(query.to) };

    const skip = (query.page - 1) * query.limit;
    const [total, data] = await Promise.all([
      this.prisma.attendance.count({ where: where as any }),
      this.prisma.attendance.findMany({
        where: where as any,
        skip,
        take: query.limit,
        orderBy: { date: 'desc' },
      }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
  }

  // ─── Today in office (WORKER + ADMIN) ──────────────────────────────────────

  async getTodayInOffice() {
    const today = startOfDayUtc(new Date());
    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: today,
        checkInAt: { not: null },
        checkOutAt: null,
      } as any,
      orderBy: { checkInAt: 'asc' },
    });

    if (attendances.length === 0) return [];

    const userIds = (attendances as any[]).map((a) => a.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null } as any,
      select: { id: true, fullName: true, avatarUrl: true },
    });

    const userMap = new Map((users as any[]).map((u) => [u.id, u]));
    return (attendances as any[]).map((a) => ({
      ...a,
      user: userMap.get(a.userId) ?? null,
    }));
  }

  // ─── Today summary (WORKER + ADMIN) ─────────────────────────────────────────

  async getTodaySummary(): Promise<{ inOffice: number; left: number; total: number; absent: number }> {
    const today = startOfDayUtc(new Date());
    const [inOffice, left, total] = await Promise.all([
      this.prisma.attendance.count({
        where: { date: today, checkInAt: { not: null }, checkOutAt: null } as any,
      }),
      this.prisma.attendance.count({
        where: { date: today, checkInAt: { not: null }, checkOutAt: { not: null } } as any,
      }),
      this.prisma.user.count({
        where: { deletedAt: null, status: UserStatus.ACTIVE } as any,
      }),
    ]);
    const absent = Math.max(0, total - inOffice - left);
    return { inOffice, left, total, absent };
  }

  // ─── Company attendance list (ADMIN) ────────────────────────────────────────

  async getCompanyAttendance(query: {
    from?: string;
    to?: string;
    userId?: string;
    status?: DayStatus;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (query.from) where.date = { ...where.date, gte: new Date(query.from) };
    if (query.to) where.date = { ...where.date, lte: new Date(query.to) };
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    const skip = (query.page - 1) * query.limit;
    const [total, data] = await Promise.all([
      this.prisma.attendance.count({ where: where as any }),
      this.prisma.attendance.findMany({
        where: where as any,
        skip,
        take: query.limit,
        orderBy: { date: 'desc' },
      }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
  }

  // ─── Delete record (ADMIN) ─────────────────────────────────────────────────

  async deleteAttendance(id: string): Promise<void> {
    const existing = await this.prisma.attendance.findFirst({
      where: { id } as any,
    });
    if (!existing) throw new NotFoundException('Запись не найдена');
    await this.prisma.attendance.delete({ where: { id } as any });
  }

  // ─── Manual patch (ADMIN) ───────────────────────────────────────────────────

  async patchAttendance(
    id: string,
    dto: {
      checkInAt?: string | null;
      checkOutAt?: string | null;
      status?: DayStatus;
      note?: string;
    },
    actorId: string,
  ) {
    const existing = await this.prisma.attendance.findFirst({
      where: { id } as any,
    });
    if (!existing) throw new NotFoundException('Запись не найдена');

    const data: any = { isManual: true };
    if (dto.checkInAt !== undefined) data.checkInAt = dto.checkInAt ? new Date(dto.checkInAt) : null;
    if (dto.checkOutAt !== undefined) data.checkOutAt = dto.checkOutAt ? new Date(dto.checkOutAt) : null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.note !== undefined) data.note = dto.note;

    const newCheckIn: Date | null = data.checkInAt !== undefined ? data.checkInAt : existing.checkInAt;
    const newCheckOut: Date | null = data.checkOutAt !== undefined ? data.checkOutAt : existing.checkOutAt;
    if (newCheckIn && newCheckOut) {
      data.workedMinutes = Math.max(0, Math.floor((newCheckOut.getTime() - newCheckIn.getTime()) / 60_000));
    }

    const updated = await this.prisma.attendance.update({
      where: { id } as any,
      data,
    });

    await this.audit.log({
      actorId,
      action: 'ATTENDANCE_MANUAL_EDIT',
      entityType: 'Attendance',
      entityId: id,
      meta: dto as Record<string, unknown>,
    });

    return updated;
  }

  // ─── Create manual record (ADMIN) ───────────────────────────────────────────

  async createManual(
    dto: {
      userId: string;
      date: string;
      status: DayStatus;
      checkInAt?: string | null;
      checkOutAt?: string | null;
      note?: string;
    },
    actorId: string,
  ) {
    const date = startOfDayUtc(new Date(dto.date));

    const existing = await this.prisma.attendance.findFirst({
      where: { userId: dto.userId, date } as any,
    });
    if (existing) throw new ConflictException('Запись за этот день уже существует');

    const checkInAt = dto.checkInAt ? new Date(dto.checkInAt) : null;
    const checkOutAt = dto.checkOutAt ? new Date(dto.checkOutAt) : null;
    const workedMinutes =
      checkInAt && checkOutAt
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
      } as any,
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
}
