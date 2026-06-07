import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider } from '../../common/interfaces/payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);

  async createCheckout(amount: number, companyId: string): Promise<string> {
    this.logger.debug(`[MockPayment] createCheckout amount=${amount} companyId=${companyId}`);
    // Replace with real gateway URL when integrating
    return `https://mock.payment/checkout?company=${companyId}&amount=${amount}`;
  }

  verifyWebhook(payload: unknown, signature: string): boolean {
    this.logger.debug(`[MockPayment] verifyWebhook signature=${signature}`);
    // Always valid in mock — real implementation must verify HMAC/signature
    return true;
  }
}
