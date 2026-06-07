import { PrismaService } from '../../prisma/prisma.service';
export declare class CompaniesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyCompany(companyId: string): Promise<{
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
