import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ErrorCode, UserStatus } from '@softtime/shared';
import { TenantPayload } from '../tenant/tenant.context';
import { RedisService } from '../redis/redis.service';
import { deletedMarkerKey } from '../../modules/users/account-deletion';

// Код ошибки для каждого неактивного статуса. Текст сообщения и HTTP-статус
// общие — различать причину клиенты должны по `code`, а не по тексту.
const INACTIVE_STATUS_CODES: Record<string, string> = {
  [UserStatus.BLOCKED]: ErrorCode.ACCOUNT_BLOCKED,
  [UserStatus.PENDING]: ErrorCode.ACCOUNT_PENDING,
  [UserStatus.DELETED]: ErrorCode.ACCOUNT_DELETED,
};

// Applied after JwtAuthGuard. Blocks users whose account is not yet active
// (PENDING) or has been blocked (BLOCKED).
// Reads req.user.status — the auth module must include UserStatus in the
// JWT payload via JwtStrategy.validate().
@Injectable()
export class StatusGuard implements CanActivate {
  private readonly logger = new Logger(StatusGuard.name);

  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: TenantPayload | undefined = context
      .switchToHttp()
      .getRequest().user;

    // Удалённый пользователь: его access-токен (JWT) ещё жив до 15 минут,
    // статус в нём ACTIVE. Отсекаем по маркеру в Redis. 401, а не 403:
    // клиент пойдёт на /auth/refresh, получит отказ и выйдет из аккаунта.
    if (user?.userId) {
      try {
        if (await this.redis.get(deletedMarkerKey(user.userId))) {
          throw new UnauthorizedException({
            message: 'Аккаунт удалён',
            code: ErrorCode.ACCOUNT_DELETED,
          });
        }
      } catch (e) {
        if (e instanceof UnauthorizedException) throw e;
        // Redis недоступен — не роняем все запросы; refresh и логин и так
        // отсекают удалённых по deletedAt.
        this.logger.warn(`deleted-marker check skipped: ${(e as Error).message}`);
      }
    }

    if (!user?.status) return true; // status not in payload yet — allow

    const code = INACTIVE_STATUS_CODES[user.status];
    if (code) {
      throw new ForbiddenException({
        message: 'Account is not active',
        code,
      });
    }
    return true;
  }
}
