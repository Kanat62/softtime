import { PaymentStatus } from "@softtime/shared";
export type { PaymentStatus };

export interface Payment {
  id: string;
  companyId: string;
  subscriptionId: string;
  amountUsd: number;
  periodStart: string;
  periodEnd: string;
  status: PaymentStatus;
  provider: string;
  providerRef: string | null;
  createdAt: string;
}
