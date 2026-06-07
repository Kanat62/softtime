import { SubStatus, PaymentStatus } from '@softtime/shared';
import type { Subscription, Payment } from '@softtime/shared';

export const mockSubscription: Subscription = {
  id: 'sub-001',
  companyId: 'company-001',
  status: SubStatus.ACTIVE,
  priceUsd: 30,
  periodStart: new Date('2026-06-01'),
  periodEnd: new Date('2026-07-01'),
  nextBillingAt: new Date('2026-07-01'),
};

export const mockPayments: Payment[] = [
  {
    id: 'pay-001',
    companyId: 'company-001',
    subscriptionId: 'sub-001',
    amountUsd: 30,
    periodStart: new Date('2026-06-01'),
    periodEnd: new Date('2026-07-01'),
    status: PaymentStatus.PAID,
    provider: 'stripe',
    providerRef: 'pi_3PbXXXXXXXXXXXXX',
    createdAt: new Date('2026-06-01T00:01:00'),
  },
  {
    id: 'pay-002',
    companyId: 'company-001',
    subscriptionId: 'sub-001',
    amountUsd: 30,
    periodStart: new Date('2026-05-01'),
    periodEnd: new Date('2026-06-01'),
    status: PaymentStatus.PAID,
    provider: 'stripe',
    providerRef: 'pi_3OaXXXXXXXXXXXXX',
    createdAt: new Date('2026-05-01T00:01:00'),
  },
];
