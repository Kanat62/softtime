import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';
import { TenantPayload } from '../tenant/tenant.context';

// Guards execute BEFORE interceptors in NestJS, so TenantContext (AsyncLocalStorage)
// is not yet populated here. Read role from req.user set by JwtAuthGuard / Passport.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: TenantPayload | undefined = context
      .switchToHttp()
      .getRequest().user;

    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
