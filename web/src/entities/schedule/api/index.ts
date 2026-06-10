import { request } from "@/shared/api/request";
import type { ScheduleDay } from "../model/types";

export const scheduleApi = {
  /** GET /schedules/:userId — расписание сотрудника (7 записей) */
  getByUserId: (userId: string) =>
    request<ScheduleDay[]>({ method: "GET", url: `/schedules/${userId}` }),

  /** PUT /schedules/:userId — сохранить расписание (ровно 7 дней, мин. 6ч рабочий день) */
  saveByUserId: (userId: string, days: ScheduleDay[]) =>
    request<ScheduleDay[]>({ method: "PUT", url: `/schedules/${userId}`, data: { days } }),

  /** POST /schedules/apply-all — применить шаблон ко всем или выбранным */
  applyToAll: (dto: { days: ScheduleDay[]; userIds?: string[] }) =>
    request<ScheduleDay[]>({ method: "POST", url: "/schedules/apply-all", data: dto }),
};
