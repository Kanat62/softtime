import { apiClient } from "@/shared/api/client";
import type { EmployeeScheduleData, ScheduleDay } from "../model/types";

export const scheduleApi = {
  /** GET /schedules — все расписания всех сотрудников */
  listAll: () => apiClient.get<EmployeeScheduleData[]>("/schedules").then((r) => r.data),

  /** GET /schedules/:userId — расписание конкретного сотрудника */
  getByUserId: (userId: string) =>
    apiClient.get<ScheduleDay[]>(`/schedules/${userId}`).then((r) => r.data),

  /** PUT /schedules/:userId — сохранить расписание сотрудника */
  saveByUserId: (userId: string, days: ScheduleDay[]) =>
    apiClient.put<ScheduleDay[]>(`/schedules/${userId}`, { days }).then((r) => r.data),

  /** POST /schedules/template — применить шаблон ко всем или выбранным */
  applyTemplate: (dto: { days: ScheduleDay[]; userIds?: string[] }) =>
    apiClient.post<void>("/schedules/template", dto),
};
