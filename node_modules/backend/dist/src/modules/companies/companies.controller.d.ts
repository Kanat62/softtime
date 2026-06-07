import { CompaniesService } from './companies.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    getMyCompany(user: TenantPayload): Promise<{
        id: string;
        name: string;
        companyCode: string;
        status: import(".prisma/client").$Enums.CompanyStatus;
        createdAt: Date;
        subscription: {
            status: import(".prisma/client").$Enums.SubStatus;
            priceUsd: import("@prisma/client-runtime-utils").Decimal;
            periodStart: Date;
            periodEnd: Date;
            nextBillingAt: Date | null;
        } | null;
    }>;
}
