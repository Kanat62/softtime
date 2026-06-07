import { z } from 'zod';
import { CompanyStatus, PaymentStatus, SubStatus } from '@softtime/shared';
import { ProviderService } from './provider.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const CompaniesQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
    status?: CompanyStatus | undefined;
    search?: string | undefined;
    subscriptionStatus?: SubStatus | undefined;
}, z.ZodObjectDef<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof CompanyStatus>>;
    subscriptionStatus: z.ZodOptional<z.ZodNativeEnum<typeof SubStatus>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status?: CompanyStatus | undefined;
    search?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    subscriptionStatus?: SubStatus | undefined;
}>;
declare class CompaniesQueryDto extends CompaniesQueryDto_base {
}
declare const PaymentsQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
    status?: PaymentStatus | undefined;
    companyId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}, z.ZodObjectDef<{
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
    companyId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof PaymentStatus>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status?: PaymentStatus | undefined;
    companyId?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}>;
declare class PaymentsQueryDto extends PaymentsQueryDto_base {
}
export declare class ProviderController {
    private readonly providerService;
    constructor(providerService: ProviderService);
    getDashboard(): Promise<{
        companies: {
            total: number;
            byStatus: Record<string, number>;
        };
        revenue: {
            mrr: any;
            total: any;
        };
        recentCompanies: {
            status: import(".prisma/client").$Enums.CompanyStatus;
            id: string;
            createdAt: Date;
            name: string;
            companyCode: string;
        }[];
        recentPayments: ({
            subscription: {
                company: {
                    name: string;
                };
            };
        } & {
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            companyId: string;
            createdAt: Date;
            periodStart: Date;
            periodEnd: Date;
            subscriptionId: string;
            amountUsd: import("@prisma/client-runtime-utils").Decimal;
            provider: string | null;
            providerRef: string | null;
        })[];
    }>;
    listPayments(query: PaymentsQueryDto): Promise<{
        summary: {
            totalAmount: any;
            count: number;
            avgAmount: number;
        };
        data: ({
            subscription: {
                company: {
                    id: string;
                    name: string;
                };
            };
        } & {
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            companyId: string;
            createdAt: Date;
            periodStart: Date;
            periodEnd: Date;
            subscriptionId: string;
            amountUsd: import("@prisma/client-runtime-utils").Decimal;
            provider: string | null;
            providerRef: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    listCompanies(query: CompaniesQueryDto): Promise<{
        data: ({
            subscription: {
                status: import(".prisma/client").$Enums.SubStatus;
                periodEnd: Date;
                nextBillingAt: Date | null;
            } | null;
            _count: {
                users: number;
            };
        } & {
            status: import(".prisma/client").$Enums.CompanyStatus;
            id: string;
            deletedAt: Date | null;
            createdAt: Date;
            name: string;
            companyCode: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    activate(id: string, user: TenantPayload): Promise<{
        ok: boolean;
    }>;
    suspend(id: string, user: TenantPayload): Promise<{
        ok: boolean;
    }>;
    getCompany(id: string): Promise<{
        subscription: ({
            payments: {
                status: import(".prisma/client").$Enums.PaymentStatus;
                id: string;
                companyId: string;
                createdAt: Date;
                periodStart: Date;
                periodEnd: Date;
                subscriptionId: string;
                amountUsd: import("@prisma/client-runtime-utils").Decimal;
                provider: string | null;
                providerRef: string | null;
            }[];
        } & {
            status: import(".prisma/client").$Enums.SubStatus;
            id: string;
            companyId: string;
            priceUsd: import("@prisma/client-runtime-utils").Decimal;
            periodStart: Date;
            periodEnd: Date;
            nextBillingAt: Date | null;
        }) | null;
        users: {
            status: import(".prisma/client").$Enums.UserStatus;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
            fullName: string;
            email: string;
            createdAt: Date;
        }[];
    } & {
        status: import(".prisma/client").$Enums.CompanyStatus;
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        name: string;
        companyCode: string;
    }>;
}
export {};
