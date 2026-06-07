import { z } from 'zod';
import { SubscriptionsService } from './subscriptions.service';
declare const WebhookPayloadDto_base: import("nestjs-zod").ZodDto<{
    status: "success" | "failed";
    companyId: string;
    providerRef?: string | undefined;
    amount?: number | undefined;
}, z.ZodObjectDef<{
    companyId: z.ZodString;
    status: z.ZodEnum<["success", "failed"]>;
    providerRef: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny>, {
    status: "success" | "failed";
    companyId: string;
    providerRef?: string | undefined;
    amount?: number | undefined;
}>;
declare class WebhookPayloadDto extends WebhookPayloadDto_base {
}
export declare class WebhooksController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    handlePaymentWebhook(dto: WebhookPayloadDto, signature: string): Promise<{
        ok: boolean;
        reason: string;
    } | {
        ok: boolean;
        reason?: undefined;
    }>;
}
export {};
