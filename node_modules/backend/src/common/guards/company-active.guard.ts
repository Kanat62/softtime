import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CompanyStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantPayload } from '../tenant/tenant.context';

// Applied on attendance endpoints (check-in / check-out) per ТЗ 4.4 / 6.1.
// Blocks access when the company subscription is SUSPENDED.
// Reads companyId from req.user and does a lightweight DB lookup.
// Company model is not in TENANT_MODELS so the lookup bypasses tenant scoping.
@Injectable()
export class CompanyActiveGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: TenantPayload | undefined = context
      .switchToHttp()
      .getRequest().user;

    // PROVIDER has no companyId — nothing to check
    if (!user?.companyId) return true;

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { status: true },
    });

    if (company?.status === CompanyStatus.SUSPENDED) {
      throw new ForbiddenException('Subscription is not active');
    }
    return true;
  }
}
