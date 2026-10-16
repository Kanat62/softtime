import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ErrorCode } from '@softtime/shared';
import { StatusGuard } from './status.guard';

function ctx(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('StatusGuard', () => {
  const redis = { get: jest.fn() };
  const guard = new StatusGuard(redis as any);

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
  });

  it('пропускает активного пользователя', async () => {
    await expect(guard.canActivate(ctx({ userId: 'u1', status: 'ACTIVE' }))).resolves.toBe(true);
    expect(redis.get).toHaveBeenCalledWith('deleted:u1');
  });

  it('отклоняет живой access-токен удалённого пользователя: 401 ACCOUNT_DELETED', async () => {
    redis.get.mockResolvedValue('1');
    await expect(guard.canActivate(ctx({ userId: 'u1', status: 'ACTIVE' }))).rejects.toMatchObject({
      constructor: UnauthorizedException,
      response: { code: ErrorCode.ACCOUNT_DELETED },
    });
  });

  it('статус DELETED в payload тоже блокируется', async () => {
    await expect(guard.canActivate(ctx({ userId: 'u1', status: 'DELETED' }))).rejects.toMatchObject({
      constructor: ForbiddenException,
      response: { code: ErrorCode.ACCOUNT_DELETED },
    });
  });

  it('BLOCKED и PENDING по-прежнему блокируются своими кодами', async () => {
    await expect(guard.canActivate(ctx({ userId: 'u1', status: 'BLOCKED' }))).rejects.toMatchObject({
      response: { code: ErrorCode.ACCOUNT_BLOCKED },
    });
    await expect(guard.canActivate(ctx({ userId: 'u1', status: 'PENDING' }))).rejects.toMatchObject({
      response: { code: ErrorCode.ACCOUNT_PENDING },
    });
  });

  it('Redis недоступен — запросы не падают (fail-open)', async () => {
    redis.get.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(guard.canActivate(ctx({ userId: 'u1', status: 'ACTIVE' }))).resolves.toBe(true);
  });

  it('публичный маршрут без user пропускается', async () => {
    await expect(guard.canActivate(ctx(undefined))).resolves.toBe(true);
    expect(redis.get).not.toHaveBeenCalled();
  });
});
