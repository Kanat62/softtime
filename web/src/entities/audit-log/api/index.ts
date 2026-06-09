import { apiClient } from "@/shared/api/client";
import type { AuditLog } from "../model/types";

export interface AuditLogParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export const auditLogApi = {
  list: (params?: AuditLogParams) =>
    apiClient.get<PaginatedAuditLogs>("/audit-logs", { params }).then((r) => r.data),
};
