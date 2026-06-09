import { apiClient } from "@/shared/api/client";
import { RequestStatus } from "@softtime/shared";
import type { AbsenceRequest } from "../model/types";

export interface PaginatedRequests {
  data: AbsenceRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface RequestParams {
  userId?: string;
  status?: RequestStatus | "";
  page: number;
  limit: number;
}

export const requestApi = {
  /** GET /requests?userId&status&page&limit */
  list: (params: RequestParams) =>
    apiClient.get<PaginatedRequests>("/requests", { params }).then((r) => r.data),

  /** POST /requests/:id/approve */
  approve: (id: string, decisionNote?: string) =>
    apiClient
      .post<AbsenceRequest>(`/requests/${id}/approve`, { decisionNote: decisionNote ?? null })
      .then((r) => r.data),

  /** POST /requests/:id/reject */
  reject: (id: string, decisionNote: string) =>
    apiClient.post<AbsenceRequest>(`/requests/${id}/reject`, { decisionNote }).then((r) => r.data),
};
