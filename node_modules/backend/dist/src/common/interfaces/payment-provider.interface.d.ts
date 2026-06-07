export declare const PAYMENT_PROVIDER = "PAYMENT_PROVIDER";
export interface PaymentProvider {
    createCheckout(amount: number, companyId: string): Promise<string>;
    verifyWebhook(payload: unknown, signature: string): boolean;
}
