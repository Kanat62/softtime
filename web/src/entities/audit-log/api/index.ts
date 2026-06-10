import { apiClient } from "@/shared/api/client";
import type { AuditLog } from "../model/types";

export interface AuditLogParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  action?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export const auditLogApi = {
  list: (params?: AuditLogParams) =>
    apiClient.get<PaginatedAuditLogs>("/audit-logs", { params }).then((r) => r.data),
};
