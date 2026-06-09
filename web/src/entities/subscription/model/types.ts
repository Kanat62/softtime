export type SubStatus = "TRIAL" | "ACTIVE" | "GRACE" | "SUSPENDED";
export interface Subscription {
  id: string;
  companyId: string;
  plan: string;
  status: SubStatus;
  nextBillingDate?: string;
  amount: number;
}
