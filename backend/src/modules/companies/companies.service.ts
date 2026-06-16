import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CompanyRequisites } from '@softtime/shared';

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
            priceUsd: company.subscription.priceUsd,
            periodStart: company.subscription.periodStart,
            periodEnd: company.subscription.periodEnd,
            nextBillingAt: company.subscription.nextBillingAt,
          }
        : null,
    };
  }

  async getRequisites(companyId: string): Promise<CompanyRequisites> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Компания не найдена');

    return {
      tax_id: company.taxId,
      tax_authority_code: company.taxAuthorityCode,
      okpo_code: company.okpoCode,
      passport_number: company.passportNumber,
      postal_code: company.postalCode,
      phone: company.phone,
      address_region: company.addressRegion,
      address_street: company.addressStreet,
      billing_email: company.billingEmail,
      social_fund_reg_number: company.socialFundRegNumber,
      highland_coefficient: company.highlandCoefficient
        ? Number(company.highlandCoefficient)
        : null,
      soate_code: company.soateCode,
      gked_code: company.gkedCode,
      legal_form: company.legalForm,
    };
  }

  async updateRequisites(
    companyId: string,
    actorId: string,
    data: CompanyRequisites,
  ): Promise<CompanyRequisites> {
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        taxId: data.tax_id,
        taxAuthorityCode: data.tax_authority_code,
        okpoCode: data.okpo_code,
        passportNumber: data.passport_number,
        postalCode: data.postal_code,
        phone: data.phone,
        addressRegion: data.address_region,
        addressStreet: data.address_street,
        billingEmail: data.billing_email,
        socialFundRegNumber: data.social_fund_reg_number,
        highlandCoefficient: data.highland_coefficient ?? undefined,
        soateCode: data.soate_code,
        gkedCode: data.gked_code,
        legalForm: data.legal_form,
      },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_COMPANY_REQUISITES',
      entityType: 'Company',
      entityId: companyId,
    });

    return {
      tax_id: company.taxId,
      tax_authority_code: company.taxAuthorityCode,
      okpo_code: company.okpoCode,
      passport_number: company.passportNumber,
      postal_code: company.postalCode,
      phone: company.phone,
      address_region: company.addressRegion,
      address_street: company.addressStreet,
      billing_email: company.billingEmail,
      social_fund_reg_number: company.socialFundRegNumber,
      highland_coefficient: company.highlandCoefficient
        ? Number(company.highlandCoefficient)
        : null,
      soate_code: company.soateCode,
      gked_code: company.gkedCode,
      legal_form: company.legalForm,
    };
  }
}
