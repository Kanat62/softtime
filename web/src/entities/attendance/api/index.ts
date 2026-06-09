import { apiClient } from "@/shared/api/client";
import type {
  AttendanceRow,
  InOfficeEmployee,
  AttendancePatchDto,
  AbsenceCreateDto,
} from "../model/types";

export interface PaginatedAttendance {
  data: AttendanceRow[];
  total: number;
  page: number;
  limit: number;
}

export interface AttendanceParams {
  page: number;
  limit: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export const attendanceApi = {
  list: (params: AttendanceParams) =>
    apiClient.get<PaginatedAttendance>("/attendance", { params }).then((r) => r.data),

  inOffice: () => apiClient.get<InOfficeEmployee[]>("/attendance/in-office").then((r) => r.data),

  patchRecord: (id: string, dto: AttendancePatchDto) =>
    apiClient.patch<AttendanceRow>(`/attendance/${id}`, dto).then((r) => r.data),

  manualCheckout: (id: string, checkOut: string) =>
    apiClient.post<AttendanceRow>(`/attendance/${id}/checkout`, { checkOut }).then((r) => r.data),

  addAbsence: (dto: AbsenceCreateDto) =>
    apiClient.post<AttendanceRow>("/attendance/absence", dto).then((r) => r.data),
};
