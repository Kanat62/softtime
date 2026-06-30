import type { EmployeeSchedule } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

export async function getMyScheduleApi(): Promise<EmployeeSchedule[]> {
  const res = await apiClient.get<EmployeeSchedule[]>('/schedules/me');
  return res.data;
}
