import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ErrorCode, UserStatus } from '@softtime/shared';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SchedulesService } from '../schedules/schedules.service';
import { RedisService } from '../../common/redis/redis.service';
import { DELETED_USER_NAME } from './account-deletion';

/**
 * Удаление аккаунта = анонимизация. Проверяем, что именно записывается,
 * что посещаемость и заявки не трогаются, и что последний админ остаётся.
 */
describe('UsersService — удаление аккаунта (анонимизация)', () => {
  let service: UsersService;

  const PASSWORD = 'correct-password';
  const passwordHash = bcrypt.hashSync(PASSWORD, 4);

  const worker = {
    id: 'u-worker', role: 'WORKER', companyId: 'co-1', status: 'ACTIVE',
    fullName: 'Иван Иванов', email: 'ivan@test.io', passwordHash,
  };
  const admin = { ...worker, id: 'u-admin', role: 'ADMIN', fullName: 'Анна Админ', email: 'a@test.io' };

  const mockPrisma = {
    user: { findFirst: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
    deviceToken: { deleteMany: jest.fn() },
    newsRead: { deleteMany: jest.fn() },
    // Эти модели удаление НЕ должно трогать — следим, что вызовов нет.
    attendance: { deleteMany: jest.fn() },
    absenceRequest: { deleteMany: jest.fn() },
    employeeSchedule: { deleteMany: jest.fn() },
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  const mockAudit = { log: jest.fn() };
  const mockRedis = { keys: jest.fn(), del: jest.fn(), set: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
    mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.deviceToken.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.newsRead.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.$executeRaw.mockResolvedValue(1);
    mockRedis.keys.mockResolvedValue(['refresh:u-worker:t1', 'refresh:u-worker:t2']);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationsService, useValue: {} },
        { provide: SchedulesService, useValue: {} },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('deleteMyAccount', () => {
    it('неверный пароль → 403 CURRENT_PASSWORD_INVALID, ничего не пишется', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);

      await expect(service.deleteMyAccount('u-worker', 'wrong')).rejects.toMatchObject({
        constructor: ForbiddenException,
        response: { code: ErrorCode.CURRENT_PASSWORD_INVALID },
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('анонимизирует поля пользователя', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);

      await service.deleteMyAccount('u-worker', PASSWORD);

      const { where, data } = mockPrisma.user.updateMany.mock.calls[0][0];
      expect(where).toEqual({ id: 'u-worker', deletedAt: null });
      expect(data.fullName).toBe(DELETED_USER_NAME);
      expect(data.email).toBe('deleted+u-worker@deleted.invalid');
      expect(data.status).toBe(UserStatus.DELETED);
      expect(data.deletedAt).toBeInstanceOf(Date);
      expect(data.adminNote).toBeNull();
      expect(data.avatarUrl).toBeNull();
    });

    it('пароль заменяется значением, с которым bcrypt.compare всегда false', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      await service.deleteMyAccount('u-worker', PASSWORD);

      const { data } = mockPrisma.user.updateMany.mock.calls[0][0];
      expect(data.passwordHash).not.toBe(passwordHash);
      expect(await bcrypt.compare(PASSWORD, data.passwordHash)).toBe(false);
      expect(await bcrypt.compare('', data.passwordHash)).toBe(false);
    });

    it('чистит токены устройств и прочтения новостей', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      await service.deleteMyAccount('u-worker', PASSWORD);

      expect(mockPrisma.deviceToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u-worker' } });
      expect(mockPrisma.newsRead.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u-worker' } });
    });

    it('НЕ удаляет посещаемость, заявки и расписание', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      await service.deleteMyAccount('u-worker', PASSWORD);

      expect(mockPrisma.attendance.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.absenceRequest.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.employeeSchedule.deleteMany).not.toHaveBeenCalled();
    });

    it('всё в одной транзакции (user + токены + новости + audit-мета)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      await service.deleteMyAccount('u-worker', PASSWORD);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction.mock.calls[0][0]).toHaveLength(4);
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('гасит refresh-токены и ставит маркер удаления для access-токена', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      await service.deleteMyAccount('u-worker', PASSWORD);

      expect(mockRedis.keys).toHaveBeenCalledWith('refresh:u-worker:*');
      expect(mockRedis.del).toHaveBeenCalledWith('refresh:u-worker:t1', 'refresh:u-worker:t2');
      expect(mockRedis.set).toHaveBeenCalledWith('deleted:u-worker', '1', expect.any(Number));
    });

    it('в журнал не пишется ФИО', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      await service.deleteMyAccount('u-worker', PASSWORD);

      const entry = mockAudit.log.mock.calls[0][0];
      expect(entry.action).toBe('ACCOUNT_DELETED_SELF');
      expect(JSON.stringify(entry)).not.toContain('Иван');
      expect(entry.meta).not.toHaveProperty('fullName');
    });

    it('повторный вызов по уже удалённому — тихо ничего не делает', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteMyAccount('u-worker', PASSWORD)).resolves.toBeUndefined();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockAudit.log).not.toHaveBeenCalled();
    });

    it('параллельный запрос успел раньше (updateMany.count = 0) → без маркера и audit', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      mockPrisma.user.updateMany.mockResolvedValue({ count: 0 });

      await service.deleteMyAccount('u-worker', PASSWORD);

      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockAudit.log).not.toHaveBeenCalled();
    });
  });

  describe('последний администратор компании', () => {
    it('единственный ADMIN → 409 LAST_ADMIN_CANNOT_DELETE, ничего не меняется', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(admin);
      mockPrisma.user.count.mockResolvedValue(0);

      await expect(service.deleteMyAccount('u-admin', PASSWORD)).rejects.toMatchObject({
        constructor: ConflictException,
        response: { code: ErrorCode.LAST_ADMIN_CANNOT_DELETE },
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('считает только других активных админов этой компании', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(admin);
      mockPrisma.user.count.mockResolvedValue(1);

      await service.deleteMyAccount('u-admin', PASSWORD);

      const where = mockPrisma.user.count.mock.calls[0][0].where;
      expect(where).toMatchObject({
        companyId: 'co-1',
        role: 'ADMIN',
        id: { not: 'u-admin' },
        deletedAt: null,
      });
      expect(where.status.in).toEqual([UserStatus.ACTIVE, UserStatus.WARNING]);
    });

    it('есть второй ADMIN → удаление проходит', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(admin);
      mockPrisma.user.count.mockResolvedValue(2);

      await service.deleteMyAccount('u-admin', PASSWORD);

      expect(mockPrisma.user.updateMany).toHaveBeenCalledTimes(1);
    });

    it('для WORKER проверка администраторов не выполняется', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);
      await service.deleteMyAccount('u-worker', PASSWORD);

      expect(mockPrisma.user.count).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser (удаление админом)', () => {
    it('нельзя удалить самого себя — права сохранены', async () => {
      await expect(service.deleteUser('u-admin', 'u-admin')).rejects.toMatchObject({
        constructor: ForbiddenException,
        response: { code: ErrorCode.CANNOT_DELETE_OWN_ACCOUNT },
      });
    });

    it('несуществующий или уже удалённый → 404, а не 500', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteUser('u-worker', 'u-admin')).rejects.toMatchObject({
        constructor: NotFoundException,
        response: { code: ErrorCode.USER_NOT_FOUND },
      });
    });

    it('анонимизирует вместо удаления и не трогает посещаемость', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(worker);

      await service.deleteUser('u-worker', 'u-admin');

      expect(mockPrisma.user.updateMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.attendance.deleteMany).not.toHaveBeenCalled();
      const entry = mockAudit.log.mock.calls[0][0];
      expect(entry).toMatchObject({ actorId: 'u-admin', action: 'USER_DELETED', entityId: 'u-worker' });
      expect(entry.meta).not.toHaveProperty('fullName');
    });
  });
});
