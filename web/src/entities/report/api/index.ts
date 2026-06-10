import { apiClient } from "@/shared/api/client";
import type { ReportRow, ReportParams } from "../model/types";

export const reportApi = {
  list: (params: ReportParams) =>
    apiClient
      .get<ReportRow[]>("/reports/attendance", { params })
      .then((r) => r.data),

  exportCsv: async (params: ReportParams): Promise<void> => {
    const response = await apiClient.get<Blob | string>("/reports/attendance/export", {
      params,
      responseType: "blob",
    });
    const data = response.data;
    const blob =
      data instanceof Blob
        ? data
        : new Blob([data as string], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${params.from}_${params.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
