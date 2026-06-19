import { apiClient } from "@/shared/api/client";
import type { Payment } from "../model/types";

export interface PaymentParams {
  page?: number;
  limit?: number;
}

export interface PaginatedPayments {
  data: Payment[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export const paymentApi = {
  list: (params?: PaymentParams) =>
    apiClient.get<PaginatedPayments>("/payments", { params }).then((r) => r.data),

  /** GET /payments/:id/receipt — PDF-чек (blob) */
  downloadReceipt: (id: string) =>
    apiClient
      .get(`/payments/${id}/receipt`, { responseType: "blob" })
      .then((r) => r.data as Blob),
};
