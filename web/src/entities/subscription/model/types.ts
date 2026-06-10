import { SubStatus } from "@softtime/shared";
export type { SubStatus };

export interface Subscription {
  id: string;
  companyId: string;
  status: SubStatus;
  priceUsd: number;
  periodStart: string;
  periodEnd: string;
  nextBillingAt: string | null;
  daysLeft: number;
}
