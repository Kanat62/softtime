import { request } from "@/shared/api/request";
import type { AttendanceRow, AttendancePatchDto, ManualAttendanceDto } from "../model/types";

export interface PaginatedAttendance {
  data: AttendanceRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AttendanceParams {
  page: number;
  limit: number;
  userId?: string;
  from?: string;
  to?: string;
  status?: string;
}

export const attendanceApi = {
  /** GET /attendance — admin list with filters */
  list: (params: AttendanceParams) =>
    request<PaginatedAttendance>({ method: "GET", url: "/attendance", params }),

  /** GET /attendance/today — employees currently checked in (no checkOut) */
  inOffice: () =>
    request<AttendanceRow[]>({ method: "GET", url: "/attendance/today" }),

  /** PATCH /attendance/:id — correct check-in/out, marks isManual=true */
  patchRecord: (id: string, dto: AttendancePatchDto) =>
    request<AttendanceRow>({ method: "PATCH", url: `/attendance/${id}`, data: dto }),

  /** Manual checkout: PATCH /attendance/:id with ISO checkOutAt */
  manualCheckout: (id: string, checkOutAt: string) =>
    request<AttendanceRow>({ method: "PATCH", url: `/attendance/${id}`, data: { checkOutAt } }),

  /** POST /attendance/manual — create absence or manual record */
  manualCreate: (dto: ManualAttendanceDto) =>
    request<AttendanceRow>({ method: "POST", url: "/attendance/manual", data: dto }),

  /** DELETE /attendance/:id — remove record (ADMIN) */
  deleteRecord: (id: string) =>
    request<void>({ method: "DELETE", url: `/attendance/${id}` }),
};
