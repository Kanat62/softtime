import { PaymentProvider } from '../../common/interfaces/payment-provider.interface';
export declare class MockPaymentProvider implements PaymentProvider {
    private readonly logger;
    createCheckout(amount: number, companyId: string): Promise<string>;
    verifyWebhook(payload: unknown, signature: string): boolean;
}
