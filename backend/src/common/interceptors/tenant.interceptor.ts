import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage, TenantPayload } from '../tenant/tenant.context';

// Reads JWT payload from request.user (set by JwtAuthGuard/Passport)
// and stores it in AsyncLocalStorage for the duration of the request.
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user: TenantPayload | undefined = req.user;

    if (!user) return next.handle();

    return new Observable((subscriber) => {
      tenantStorage.run(user, () => {
        next.handle().subscribe({
          next: (v) => subscriber.next(v),
          error: (e) => subscriber.error(e),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
