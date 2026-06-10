import { RequestStatus } from "@softtime/shared";
import { request } from "@/shared/api/request";
import type { AbsenceRequest } from "../model/types";

export interface PaginatedRequests {
  data: AbsenceRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
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
    request<PaginatedRequests>({ method: "GET", url: "/requests", params }),

  /** PATCH /requests/:id/approve */
  approve: (id: string) =>
    request<AbsenceRequest>({ method: "PATCH", url: `/requests/${id}/approve` }),

  /** PATCH /requests/:id/reject */
  reject: (id: string, decisionNote: string) =>
    request<AbsenceRequest>({
      method: "PATCH",
      url: `/requests/${id}/reject`,
      data: { decisionNote },
    }),
};
