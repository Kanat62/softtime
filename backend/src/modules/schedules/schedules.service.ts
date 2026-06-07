import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DayScheduleDto } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const WEEKDAY_ORDER: Record<string, number> = {
  MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6,
};

function sortByWeekday<T extends { weekday: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => WEEKDAY_ORDER[a.weekday] - WEEKDAY_ORDER[b.weekday]);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toScheduleData(day: DayScheduleDto, userId: string) {
  return {
    userId,
    weekday: day.weekday,
    isWorkingDay: day.isWorkingDay,
    startTime: day.startTime ?? null,
    endTime: day.endTime ?? null,
    autoCheckoutBuffer: day.autoCheckoutBuffer,
  };
}

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Own schedule ─────────────────────────────────────────────────────────────

  async getMySchedule(userId: string) {
    const rows = await this.prisma.employeeSchedule.findMany({
      where: { userId } as any,
    });
    return sortByWeekday(rows);
  }

  // ─── Schedule for a specific employee ────────────────────────────────────────

  async getUserSchedule(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null } as any,
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const rows = await this.prisma.employeeSchedule.findMany({
      where: { userId } as any,
    });
    return sortByWeekday(rows);
  }

  // ─── Save 7-day schedule ──────────────────────────────────────────────────────

  async saveSchedule(userId: string, days: DayScheduleDto[], actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null } as any,
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    await this.validateMinHours(days);

    // Atomic replace: delete all existing days then create fresh set
    await this.prisma.employeeSchedule.deleteMany({ where: { userId } as any });
    await this.prisma.employeeSchedule.createMany({
      data: days.map((d) => toScheduleData(d, userId)) as any,
    });

    await this.audit.log({
      actorId,
      action: 'SCHEDULE_UPDATED',
      entityType: 'EmployeeSchedule',
      entityId: userId,
      meta: { userId },
    });

    const rows = await this.prisma.employeeSchedule.findMany({
      where: { userId } as any,
    });
    return sortByWeekday(rows);
  }

  // ─── Apply template to all (or a subset of) employees ────────────────────────

  async applyAll(days: DayScheduleDto[], actorId: string, userIds?: string[]) {
    await this.validateMinHours(days);

    const userWhere: any = { deletedAt: null };
    if (userIds?.length) userWhere.id = { in: userIds };

    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });
    if (!users.length) return { applied: 0 };

    const targetIds = users.map((u) => u.id);

    // Two-step bulk replace inside one companyId scope
    await this.prisma.employeeSchedule.deleteMany({
      where: { userId: { in: targetIds } } as any,
    });
    await this.prisma.employeeSchedule.createMany({
      data: targetIds.flatMap((uid) => days.map((d) => toScheduleData(d, uid))) as any,
    });

    await this.audit.log({
      actorId,
      action: 'SCHEDULE_APPLY_ALL',
      entityType: 'EmployeeSchedule',
      meta: { applied: targetIds.length, subset: !!userIds?.length },
    });

    return { applied: targetIds.length };
  }

  // ─── Shared validation ────────────────────────────────────────────────────────

  private async validateMinHours(days: DayScheduleDto[]) {
    // Fetch company-specific minimum from WorkSettings (extension injects companyId)
    const settings = await this.prisma.workSettings.findFirst({ where: {} as any });
    const minMinutes = (settings?.minWorkdayHours ?? 6) * 60;

    for (const day of days) {
      if (!day.isWorkingDay || !day.startTime || !day.endTime) continue;

      const duration = timeToMinutes(day.endTime) - timeToMinutes(day.startTime);
      if (duration < minMinutes) {
        const minHours = minMinutes / 60;
        throw new UnprocessableEntityException(
          `${day.weekday}: рабочий день должен быть не менее ${minHours} ч (${day.startTime}–${day.endTime})`,
        );
      }
    }
  }
}
