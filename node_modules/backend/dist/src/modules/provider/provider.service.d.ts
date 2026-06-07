import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ProviderService {
    private readonly prisma;
    private readonly audit;
    private readonly notifications;
    constructor(prisma: PrismaService, audit: AuditService, notifications: NotificationsService);
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
    listCompanies(query: {
        status?: string;
        subscriptionStatus?: string;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{
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
    activateCompany(id: string, actorId: string): Promise<{
        ok: boolean;
    }>;
    suspendCompany(id: string, actorId: string): Promise<{
        ok: boolean;
    }>;
    listPayments(query: {
        from?: Date;
        to?: Date;
        companyId?: string;
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
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
}
