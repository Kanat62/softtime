import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserStatus } from '@softtime/shared';
import { TenantPayload } from '../tenant/tenant.context';

const INACTIVE_STATUSES = new Set<string>([
  UserStatus.BLOCKED,
  UserStatus.PENDING,
]);

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

    if (INACTIVE_STATUSES.has(user.status)) {
      throw new ForbiddenException('Account is not active');
    }
    return true;
  }
}
