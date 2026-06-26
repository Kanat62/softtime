import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getMyCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true },
    });
    if (!company) throw new NotFoundException('Компания не найдена');

    return {
      id: company.id,
      name: company.name,
      companyCode: company.companyCode,
      status: company.status,
      createdAt: company.createdAt,
      subscription: company.subscription
        ? {
            status: company.subscription.status,
            priceUsd: 10,
            periodStart: company.subscription.periodStart,
            periodEnd: company.subscription.periodEnd,
            nextBillingAt: company.subscription.nextBillingAt,
          }
        : null,
    };
  }

}
