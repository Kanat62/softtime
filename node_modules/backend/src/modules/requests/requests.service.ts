import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  DayStatus,
  RequestStatus,
  RequestType,
} from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { startOfDayUtc } from '../attendance/attendance.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Types that mark calendar days as APPROVED_ABSENCE in Attendance
const ABSENCE_DAY_TYPES: RequestType[] = [
  RequestType.SICK,
  RequestType.FAMILY,
  RequestType.VACATION,
  RequestType.BUSINESS_TRIP,
  RequestType.REMOTE,
];

/** Returns an array of UTC-midnight Date objects for each day [start, end]. */
function eachDayInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = startOfDayUtc(start);
  const last = startOfDayUtc(end);
  while (cur.getTime() <= last.getTime()) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.SICK]: 'Больничный',
  [RequestType.FAMILY]: 'По семейным обстоятельствам',
  [RequestType.VACATION]: 'Отпуск',
  [RequestType.BUSINESS_TRIP]: 'Командировка',
  [RequestType.REMOTE]: 'Удалённая работа',
  [RequestType.LATE_REASON]: 'Причина опоздания',
  [RequestType.EARLY_LEAVE]: 'Ранний уход',
  [RequestType.OTHER]: 'Прочее',
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async createRequest(
    dto: {
      type: RequestType;
      startDate: Date;
      endDate?: Date | null;
      desiredTime?: string | null;
      comment?: string | null;
    },
    userId: string,
    companyId: string,
  ) {
    if (dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate не может быть раньше startDate');
    }

    const request = await this.prisma.absenceRequest.create({
      data: {
        userId,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
        desiredTime: dto.desiredTime ?? null,
        comment: dto.comment ?? null,
        status: RequestStatus.PENDING,
      } as any,
    });

    // Push ADMIN: «Заявка подана»
    const user = await this.prisma.user.findFirst({
      where: { id: userId } as any,
      select: { fullName: true },
    });
    const label = REQUEST_TYPE_LABELS[dto.type] ?? dto.type;
    await this.notifications.sendToCompanyAdmins(
      companyId,
      'Новая заявка',
      `Заявка подана: ${label} от ${user?.fullName ?? userId}`,
    );

    return request;
  }

  // ─── My requests ─────────────────────────────────────────────────────────────

  async getMyRequests(
    userId: string,
    query: { status?: RequestStatus; page: number; limit: number },
  ) {
    const where: any = { userId };
    if (query.status) where.status = query.status;

    const skip = (query.page - 1) * query.limit;
    const [total, data] = await Promise.all([
      this.prisma.absenceRequest.count({ where: where as any }),
      this.prisma.absenceRequest.findMany({
        where: where as any,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
  }

  // ─── Company requests (ADMIN) ─────────────────────────────────────────────────

  async getCompanyRequests(query: {
    status?: RequestStatus;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const skip = (query.page - 1) * query.limit;
    const [total, data] = await Promise.all([
      this.prisma.absenceRequest.count({ where: where as any }),
      this.prisma.absenceRequest.findMany({
        where: where as any,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
  }

  // ─── Approve ──────────────────────────────────────────────────────────────────

  async approveRequest(id: string, actorId: string) {
    const request = await this.prisma.absenceRequest.findFirst({
      where: { id } as any,
    });
    if (!request) throw new NotFoundException('Заявка не найдена');
    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException('Заявка уже обработана');
    }

    // Update request status
    const updated = await this.prisma.absenceRequest.update({
      where: { id } as any,
      data: {
        status: RequestStatus.APPROVED,
        decidedBy: actorId,
      },
    });

    // Mark attendance days based on request type
    if (ABSENCE_DAY_TYPES.includes(request.type as RequestType)) {
      await this.markApprovedAbsenceDays(
        request.userId,
        request.startDate,
        request.endDate ?? request.startDate,
      );
    }
    // EARLY_LEAVE: check-out reads the approved AbsenceRequest directly — no Attendance change needed.
    // LATE_REASON / OTHER: history-only, no Attendance impact.

    await Promise.all([
      this.audit.log({
        actorId,
        action: 'REQUEST_APPROVED',
        entityType: 'AbsenceRequest',
        entityId: id,
        meta: { type: request.type, userId: request.userId },
      }),
      this.notifications.sendToUser(
        request.userId,
        'Заявка одобрена',
        `Ваша заявка «${REQUEST_TYPE_LABELS[request.type as RequestType] ?? request.type}» одобрена`,
      ),
    ]);

    return updated;
  }

  // ─── Reject ───────────────────────────────────────────────────────────────────

  async rejectRequest(id: string, actorId: string, decisionNote?: string) {
    const request = await this.prisma.absenceRequest.findFirst({
      where: { id } as any,
    });
    if (!request) throw new NotFoundException('Заявка не найдена');
    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException('Заявка уже обработана');
    }

    const updated = await this.prisma.absenceRequest.update({
      where: { id } as any,
      data: {
        status: RequestStatus.REJECTED,
        decidedBy: actorId,
        decisionNote: decisionNote ?? null,
      },
    });

    const reason = decisionNote ? `: ${decisionNote}` : '';
    await Promise.all([
      this.audit.log({
        actorId,
        action: 'REQUEST_REJECTED',
        entityType: 'AbsenceRequest',
        entityId: id,
        meta: { type: request.type, userId: request.userId, decisionNote },
      }),
      this.notifications.sendToUser(
        request.userId,
        'Заявка отклонена',
        `Ваша заявка «${REQUEST_TYPE_LABELS[request.type as RequestType] ?? request.type}» отклонена${reason}`,
      ),
    ]);

    return updated;
  }

  // ─── Private: mark days as APPROVED_ABSENCE ────────────────────────────────

  private async markApprovedAbsenceDays(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const days = eachDayInRange(startDate, endDate);

    // Batch-fetch existing attendance records in the range
    const existing = await this.prisma.attendance.findMany({
      where: { userId, date: { in: days } } as any,
      select: { id: true, date: true },
    });

    const existingDateStrs = new Set(
      (existing as any[]).map((a) =>
        new Date(a.date).toISOString().slice(0, 10),
      ),
    );
    const missingDays = days.filter(
      (d) => !existingDateStrs.has(d.toISOString().slice(0, 10)),
    );

    await Promise.all([
      // Update existing records to APPROVED_ABSENCE
      ...(existing as any[]).map((a) =>
        this.prisma.attendance.update({
          where: { id: a.id } as any,
          data: { status: DayStatus.APPROVED_ABSENCE },
        }),
      ),
      // Create records for days without any attendance
      ...(missingDays.length
        ? [
            this.prisma.attendance.createMany({
              data: missingDays.map((date) => ({
                userId,
                date,
                status: DayStatus.APPROVED_ABSENCE,
              })) as any,
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }
}
