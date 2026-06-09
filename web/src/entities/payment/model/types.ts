export type PaymentStatus = "PAID" | "PENDING" | "REJECTED";
export interface Payment {
  id: string;
  companyId: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  date: string;
  invoiceNumber?: string;
}
