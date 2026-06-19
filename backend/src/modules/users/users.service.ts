import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserStatus, UserRole } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SchedulesService } from '../schedules/schedules.service';

const BCRYPT_ROUNDS = 12;

// Fields safe to return — never include passwordHash
const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
  hiredAt: true,
  adminNote: true,
  createdAt: true,
  companyId: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly schedules: SchedulesService,
  ) {}

  // ─── List employees ───────────────────────────────────────────────────────────

  async listUsers(query: {
    status?: UserStatus;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { status, search, page, limit } = query;
    const where: Record<string, unknown> = { deletedAt: null };

    if (status) where['status'] = status;
    if (search) {
      where['OR'] = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where: where as any }),
      this.prisma.user.findMany({
        where: where as any,
        skip,
        take: limit,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Get user with attendance + requests ─────────────────────────────────────

  async getUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const [attendance, requests] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { userId: id } as any,
        orderBy: { date: 'desc' },
        take: 50,
      }),
      this.prisma.absenceRequest.findMany({
        where: { userId: id } as any,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { user, attendance, requests };
  }

  // ─── Approve: PENDING → ACTIVE ────────────────────────────────────────────────

  async approveUser(id: string, actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('Пользователь не в статусе PENDING');
    }

    const updated = await this.prisma.user.update({
      where: { id } as any,
      data: { status: UserStatus.ACTIVE },
      select: USER_SELECT,
    });

    await Promise.all([
      this.audit.log({
        actorId,
        action: 'USER_APPROVED',
        entityType: 'User',
        entityId: id,
        meta: { previousStatus: UserStatus.PENDING },
      }),
      this.notifications.sendToUser(
        id,
        'Регистрация одобрена',
        'Ваша регистрация в компании одобрена',
      ),
      user.companyId
        ? this.schedules.applyDefaultToUser(id, user.companyId)
        : Promise.resolve(),
    ]);

    return updated;
  }

  // ─── Reject: hard-delete PENDING user ───────────────────────────────────────

  async rejectUser(id: string, actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('Пользователь не в статусе PENDING');
    }

    // Send notification before deletion so FCM token still exists
    await this.notifications.sendToUser(
      id,
      'Регистрация отклонена',
      'Ваша заявка на регистрацию была отклонена',
    );

    await this.audit.log({
      actorId,
      action: 'USER_REJECTED',
      entityType: 'User',
      entityId: id,
    });

    await this.prisma.$transaction([
      this.prisma.deviceToken.deleteMany({ where: { userId: id } }),
      this.prisma.newsRead.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }

  // ─── Change status (ACTIVE / BLOCKED / WARNING) ───────────────────────────────

  async setUserStatus(id: string, status: UserStatus, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('Нельзя изменить статус самому себе');
    }

    const allowed: UserStatus[] = [
      UserStatus.ACTIVE,
      UserStatus.BLOCKED,
      UserStatus.WARNING,
    ];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Допустимые статусы: ACTIVE, BLOCKED, WARNING');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const updated = await this.prisma.user.update({
      where: { id } as any,
      data: { status },
      select: USER_SELECT,
    });

    await this.audit.log({
      actorId,
      action: 'USER_STATUS_CHANGED',
      entityType: 'User',
      entityId: id,
      meta: { previousStatus: user.status, newStatus: status },
    });

    return updated;
  }

  // ─── Save admin note ──────────────────────────────────────────────────────────

  async setAdminNote(id: string, note: string, actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const updated = await this.prisma.user.update({
      where: { id } as any,
      data: { adminNote: note },
      select: USER_SELECT,
    });

    await this.audit.log({
      actorId,
      action: 'USER_NOTE_UPDATED',
      entityType: 'User',
      entityId: id,
    });

    return updated;
  }

  // ─── Hard delete ─────────────────────────────────────────────────────────────

  async deleteUser(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('Нельзя удалить собственный аккаунт');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    // Audit log before deletion — user record won't exist after
    await this.audit.log({
      actorId,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      meta: { previousStatus: user.status, fullName: user.fullName },
    });

    await this.prisma.$transaction([
      this.prisma.deviceToken.deleteMany({ where: { userId: id } }),
      this.prisma.newsRead.deleteMany({ where: { userId: id } }),
      this.prisma.absenceRequest.deleteMany({ where: { userId: id } }),
      this.prisma.employeeSchedule.deleteMany({ where: { userId: id } }),
      this.prisma.attendance.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }

  // ─── Own profile ──────────────────────────────────────────────────────────────

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null } as any,
      select: {
        ...USER_SELECT,
        company: { select: { name: true, companyCode: true } },
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const { company, ...rest } = user as any;
    return {
      ...rest,
      companyName: company?.name ?? null,
      companyCode: company?.companyCode ?? null,
    };
  }

  // ─── Update own profile ───────────────────────────────────────────────────────

  async updateMyProfile(
    userId: string,
    dto: {
      avatarUrl?: string | null;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null } as any,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const data: Record<string, unknown> = {};

    if (dto.avatarUrl !== undefined) {
      data['avatarUrl'] = dto.avatarUrl;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('currentPassword обязателен для смены пароля');
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Текущий пароль неверен');
      }
      data['passwordHash'] = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Нет данных для обновления');
    }

    return this.prisma.user.update({
      where: { id: userId } as any,
      data,
      select: USER_SELECT,
    });
  }

}
