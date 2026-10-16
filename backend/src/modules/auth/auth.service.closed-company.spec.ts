import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ErrorCode } from '@softtime/shared';
import { AuthService } from './auth.service';

/**
 * Сотрудники закрытой компании не могут войти и зарегистрироваться по её коду.
 */
describe('AuthService — закрытая компания', () => {
  const hash = bcrypt.hashSync('password123', 4);
  const prisma: any = {
    user: { findFirst: jest.fn(), create: jest.fn() },
    company: { findUnique: jest.fn() },
  };
  const redis: any = { get: jest.fn(), set: jest.fn(), incr: jest.fn(), expire: jest.fn(), del: jest.fn(), keys: jest.fn() };
  const jwt: any = { signAsync: jest.fn().mockResolvedValue('tok') };
  const config: any = { get: jest.fn((_k: string, d?: unknown) => d) };
  const notifications: any = { sendToCompanyAdmins: jest.fn(), sendToProviders: jest.fn() };

  const service = new AuthService(prisma, jwt, redis, config, notifications);

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
  });

  it('логин с верным паролем в закрытую компанию → 403 COMPANY_CLOSED, токены не выдаются', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', role: 'WORKER', companyId: 'co-1', status: 'ACTIVE', passwordHash: hash,
    });
    prisma.company.findUnique.mockResolvedValue({ status: 'CLOSED' });

    await expect(
      service.login({ email: 'w@t.io', password: 'password123' } as any, '1.1.1.1'),
    ).rejects.toMatchObject({
      constructor: ForbiddenException,
      response: { code: ErrorCode.COMPANY_CLOSED },
    });
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('неверный пароль — по-прежнему INVALID_CREDENTIALS (состояние компании не раскрывается)', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', role: 'WORKER', companyId: 'co-1', status: 'ACTIVE', passwordHash: hash,
    });
    redis.incr.mockResolvedValue(1);

    await expect(
      service.login({ email: 'w@t.io', password: 'wrong' } as any, '1.1.1.1'),
    ).rejects.toMatchObject({ response: { code: ErrorCode.INVALID_CREDENTIALS } });
    expect(prisma.company.findUnique).not.toHaveBeenCalled();
  });

  it('логин в открытую компанию работает как раньше', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', role: 'WORKER', companyId: 'co-1', status: 'ACTIVE', passwordHash: hash,
      fullName: 'W', email: 'w@t.io', language: 'ru',
    });
    prisma.company.findUnique.mockResolvedValue({ status: 'ACTIVE' });

    const res = await service.login({ email: 'w@t.io', password: 'password123' } as any, '1.1.1.1');
    expect(res.accessToken).toBe('tok');
  });

  it('регистрация сотрудника по коду закрытой компании → 403 COMPANY_CLOSED', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'co-1', status: 'CLOSED' });

    await expect(
      service.registerWorker({
        fullName: 'N', email: 'n@t.io', password: 'password123', companyCode: '123456',
      } as any),
    ).rejects.toMatchObject({
      constructor: ForbiddenException,
      response: { code: ErrorCode.COMPANY_CLOSED },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
