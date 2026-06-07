export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface PaymentProvider {
  /** Initiates a checkout session and returns a URL or token for the client. */
  createCheckout(amount: number, companyId: string): Promise<string>;

  /** Verifies the webhook signature from the payment gateway. */
  verifyWebhook(payload: unknown, signature: string): boolean;
}
