import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentProvider } from '../../common/interfaces/payment-provider.interface';
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly audit;
    private readonly notifications;
    private readonly paymentProvider;
    constructor(prisma: PrismaService, audit: AuditService, notifications: NotificationsService, paymentProvider: PaymentProvider);
    getMySubscription(companyId: string): Promise<any>;
    initiatePayment(companyId: string): Promise<{
        checkoutUrl: string;
    }>;
    cancelSubscription(companyId: string, actorId: string): Promise<{
        status: import(".prisma/client").$Enums.SubStatus;
        id: string;
        companyId: string;
        priceUsd: import("@prisma/client-runtime-utils").Decimal;
        periodStart: Date;
        periodEnd: Date;
        nextBillingAt: Date | null;
    }>;
    getPayments(companyId: string, query: {
        page: number;
        limit: number;
    }): Promise<{
        data: {
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
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    handleWebhook(payload: {
        companyId: string;
        status: string;
        providerRef?: string;
        amount?: number;
    }, signature: string): Promise<{
        ok: boolean;
        reason: string;
    } | {
        ok: boolean;
        reason?: undefined;
    }>;
}
