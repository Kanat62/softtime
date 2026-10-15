import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ErrorCode, UserStatus } from '@softtime/shared';
import { TenantPayload } from '../tenant/tenant.context';

// Код ошибки для каждого неактивного статуса. Текст сообщения и HTTP-статус
// общие — различать причину клиенты должны по `code`, а не по тексту.
const INACTIVE_STATUS_CODES: Record<string, string> = {
  [UserStatus.BLOCKED]: ErrorCode.ACCOUNT_BLOCKED,
  [UserStatus.PENDING]: ErrorCode.ACCOUNT_PENDING,
};

// Applied after JwtAuthGuard. Blocks users whose account is not yet active
// (PENDING) or has been blocked (BLOCKED).
// Reads req.user.status — the auth module must include UserStatus in the
// JWT payload via JwtStrategy.validate().
@Injectable()
export class StatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user: TenantPayload | undefined = context
      .switchToHttp()
      .getRequest().user;

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
