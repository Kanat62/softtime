import { z } from 'zod';
import { SubscriptionsService } from './subscriptions.service';
import { TenantPayload } from '../../common/tenant/tenant.context';
declare const PaymentsQueryDto_base: import("nestjs-zod").ZodDto<{
    limit: number;
    page: number;
}, z.ZodObjectDef<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
declare class PaymentsQueryDto extends PaymentsQueryDto_base {
}
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    getMySubscription(user: TenantPayload): Promise<any>;
    initiatePayment(user: TenantPayload): Promise<{
        checkoutUrl: string;
    }>;
    cancel(user: TenantPayload): Promise<{
        status: import(".prisma/client").$Enums.SubStatus;
        id: string;
        companyId: string;
        priceUsd: import("@prisma/client-runtime-utils").Decimal;
        periodStart: Date;
        periodEnd: Date;
        nextBillingAt: Date | null;
    }>;
}
export declare class PaymentsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    getPayments(query: PaymentsQueryDto, user: TenantPayload): Promise<{
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
}
export {};
