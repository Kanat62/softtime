import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import {
  ErrorCode,
  UserStatus,
  UserRole,
  CompanyStatus,
  SubStatus,
  type Language,
} from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SchedulesService } from '../schedules/schedules.service';
import { RedisService } from '../../common/redis/redis.service';
import {
  DELETED_USER_NAME,
  DELETED_MARKER_TTL_SECONDS,
  deletedEmail,
  deletedMarkerKey,
  companyClosedMarkerKey,
} from './account-deletion';

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
  language: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly schedules: SchedulesService,
    private readonly redis: RedisService,
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
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

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
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException({
        message: 'Пользователь не в статусе PENDING',
        code: ErrorCode.USER_NOT_PENDING,
      });
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
      this.notifications.sendToUser(id, 'registrationApproved'),
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
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException({
        message: 'Пользователь не в статусе PENDING',
        code: ErrorCode.USER_NOT_PENDING,
      });
    }

    // Send notification before deletion so FCM token still exists
    await this.notifications.sendToUser(id, 'registrationRejected');

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
      throw new BadRequestException({
        message: 'Нельзя изменить статус самому себе',
        code: ErrorCode.CANNOT_CHANGE_OWN_STATUS,
      });
    }

    const allowed: UserStatus[] = [
      UserStatus.ACTIVE,
      UserStatus.BLOCKED,
      UserStatus.WARNING,
    ];
    if (!allowed.includes(status)) {
      throw new BadRequestException({
        message: 'Допустимые статусы: ACTIVE, BLOCKED, WARNING',
        code: ErrorCode.INVALID_USER_STATUS,
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
    });
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

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
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

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
      throw new ForbiddenException({
        message: 'Нельзя удалить собственный аккаунт',
        code: ErrorCode.CANNOT_DELETE_OWN_ACCOUNT,
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null } as any,
    });
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

    // Было жёсткое удаление вместе с историей посещаемости. Теперь
    // анонимизация: посещаемость, заявки и расписание остаются для отчётов.
    const result = await this.anonymize({
      id: user.id,
      role: user.role,
      companyId: user.companyId,
    });

    // deleted === false — параллельный запрос успел раньше; второй раз не пишем.
    if (result.deleted) {
      await this.audit.log({
        actorId,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: id,
        // ФИО в журнал больше не пишем (персональные данные).
        meta: { previousStatus: user.status, role: user.role },
      });
    }
  }

  // ─── Delete own account (App Store 5.1.1(v) / Google Play) ────────────────────

  /**
   * Самоудаление аккаунта с подтверждением паролем.
   *
   * Идемпотентно: если пользователь уже удалён (повторный запрос по ещё
   * живому access-токену), молча завершаемся.
   *
   * Единственный админ компании: без closeCompany — 409
   * LAST_ADMIN_CANNOT_DELETE и ничего не меняется (чтобы случайно ничего не
   * закрылось); с closeCompany: true — компания закрывается вместе с
   * аккаунтом. Флаг игнорируется для WORKER и для админа, у которого есть
   * коллега-админ: закрыть компанию «по ошибке» таким запросом нельзя.
   * Неверный пароль — 403 с кодом CURRENT_PASSWORD_INVALID, а не 401: 401
   * заставил бы клиентский interceptor впустую ротировать refresh-токен.
   */
  async deleteMyAccount(userId: string, password: string, closeCompany = false) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null } as any,
    });
    if (!user) return;

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new ForbiddenException({
        message: 'Текущий пароль неверен',
        code: ErrorCode.CURRENT_PASSWORD_INVALID,
      });
    }

    const result = await this.anonymize(
      { id: user.id, role: user.role, companyId: user.companyId },
      { closeCompany },
    );

    if (result.deleted) {
      await this.audit.log({
        actorId: userId,
        action: 'ACCOUNT_DELETED_SELF',
        entityType: 'User',
        entityId: userId,
        meta: { previousStatus: user.status, role: user.role },
      });
    }
    if (result.companyClosed && user.companyId) {
      await this.audit.log({
        actorId: userId,
        action: 'COMPANY_CLOSED',
        entityType: 'Company',
        entityId: user.companyId,
        // Без имён: только идентификатор и число отключённых сотрудников.
        meta: { closedBy: userId, affectedUsers: result.affectedUsers },
      });
    }
  }

  /**
   * Обезличивает пользователя вместо удаления строки.
   *
   *  - ФИО, email, пароль, заметка админа и ссылка на аватар затираются;
   *  - status = DELETED, deletedAt = now (логин и /auth/refresh уже
   *    отсекают deletedAt != null);
   *  - токены устройств и отметки прочтения новостей удаляются;
   *  - посещаемость, заявки и расписание остаются — они нужны работодателю
   *    для отчётов и теперь показывают обезличенное имя;
   *  - ФИО убирается из meta ранее записанных событий журнала.
   *
   * Возвращает false, если пользователь уже был удалён параллельным
   * запросом: условие `deletedAt: null` в updateMany делает операцию
   * безопасной при повторе.
   */
  private async anonymize(
    user: { id: string; role: string; companyId: string | null },
    options: { closeCompany?: boolean } = {},
  ): Promise<{ deleted: boolean; companyClosed: boolean; affectedUsers: number }> {
    let closing = false;

    // Компания не должна остаться без администратора.
    if (user.role === UserRole.ADMIN && user.companyId) {
      const otherAdmins = await this.prisma.user.count({
        where: {
          companyId: user.companyId,
          role: UserRole.ADMIN,
          id: { not: user.id },
          deletedAt: null,
          status: { in: [UserStatus.ACTIVE, UserStatus.WARNING] },
        } as any,
      });
      if (otherAdmins === 0) {
        if (!options.closeCompany) {
          throw new ConflictException({
            message:
              'Вы единственный администратор компании. Чтобы удалить аккаунт, нужно закрыть компанию.',
            code: ErrorCode.LAST_ADMIN_CANNOT_DELETE,
          });
        }
        closing = true;
      }
    }

    // Остальные сотрудники закрываемой компании. Их записи НЕ меняются и НЕ
    // стираются: доступ отсекается статусом компании (CLOSED), а данные
    // остаются у работодателя/оператора. Это обратимо на уровне БД и не
    // уничтожает чужие данные из-за решения одного человека.
    let otherUserIds: string[] = [];
    if (closing && user.companyId) {
      const others = await this.prisma.user.findMany({
        where: { companyId: user.companyId, deletedAt: null, id: { not: user.id } } as any,
        select: { id: true },
      });
      otherUserIds = (others as Array<{ id: string }>).map((u) => u.id);
    }

    const userUpdate = this.prisma.user.updateMany({
      where: { id: user.id, deletedAt: null } as any,
      data: {
        fullName: DELETED_USER_NAME,
        email: deletedEmail(user.id),
        // Не bcrypt-формат: bcrypt.compare на нём всегда даёт false.
        passwordHash: `!${randomUUID()}`,
        status: UserStatus.DELETED,
        deletedAt: new Date(),
        adminNote: null,
        avatarUrl: null,
      } as any,
    });

    const ops: any[] = [
      userUpdate,
      this.prisma.deviceToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.newsRead.deleteMany({ where: { userId: user.id } }),
      this.prisma.$executeRaw`
        UPDATE "AuditLog"
        SET meta = meta - 'fullName'
        WHERE "entityType" = 'User' AND "entityId" = ${user.id} AND meta IS NOT NULL
      `,
    ];

    if (closing && user.companyId) {
      ops.push(
        // Закрыта навсегда: provider.activateCompany и платёжный webhook этот
        // статус не снимают (см. проверки там).
        this.prisma.company.update({
          where: { id: user.companyId },
          data: { status: CompanyStatus.CLOSED },
        }),
        // Отменяем подписку: иначе cron подписок через грейс-период перевёл бы
        // компанию из CLOSED в SUSPENDED.
        this.prisma.subscription.updateMany({
          where: { companyId: user.companyId },
          data: { status: SubStatus.CANCELLED },
        }),
        // Push закрытой компании больше не нужны.
        this.prisma.deviceToken.deleteMany({ where: { userId: { in: otherUserIds } } }),
      );
    }

    const results = await this.prisma.$transaction(ops);

    const changed = (results[0] as { count: number }).count;
    if (changed === 0) return { deleted: false, companyClosed: false, affectedUsers: 0 };

    // Токены: refresh гасим сразу, access блокируют маркеры в StatusGuard.
    const revoke = async (id: string) => {
      const keys = await this.redis.keys(`refresh:${id}:*`);
      if (keys.length) await this.redis.del(...keys);
    };
    await revoke(user.id);
    await this.redis.set(deletedMarkerKey(user.id), '1', DELETED_MARKER_TTL_SECONDS);

    if (closing && user.companyId) {
      for (const id of otherUserIds) await revoke(id);
      await this.redis.set(
        companyClosedMarkerKey(user.companyId),
        '1',
        DELETED_MARKER_TTL_SECONDS,
      );
    }

    return { deleted: true, companyClosed: closing, affectedUsers: otherUserIds.length };
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
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }
    const { company, ...rest } = user as any;
    return {
      ...rest,
      companyName: company?.name ?? null,
      companyCode: company?.companyCode ?? null,
    };
  }

  // ─── Язык интерфейса ──────────────────────────────────────────────────────────

  /**
   * PATCH /users/me/language — на каком языке присылать push этому
   * пользователю. Отдельно от PATCH /profile: смена языка происходит
   * при каждом переключении в приложении, она не должна проходить через
   * ветку currentPassword/newPassword и правило «нет данных для обновления».
   * Audit не пишем — это настройка интерфейса, а не действие над данными.
   */
  async updateMyLanguage(userId: string, language: Language) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null } as any,
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

    return this.prisma.user.update({
      where: { id: userId } as any,
      data: { language },
      select: { id: true, language: true },
    });
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
    if (!user) {
      throw new NotFoundException({
        message: 'Пользователь не найден',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

    const data: Record<string, unknown> = {};

    if (dto.avatarUrl !== undefined) {
      data['avatarUrl'] = dto.avatarUrl;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException({
          message: 'currentPassword обязателен для смены пароля',
          code: ErrorCode.CURRENT_PASSWORD_REQUIRED,
        });
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException({
          message: 'Текущий пароль неверен',
          code: ErrorCode.CURRENT_PASSWORD_INVALID,
        });
      }
      data['passwordHash'] = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException({
        message: 'Нет данных для обновления',
        code: ErrorCode.NO_FIELDS_TO_UPDATE,
      });
    }

    return this.prisma.user.update({
      where: { id: userId } as any,
      data,
      select: USER_SELECT,
    });
  }

}
