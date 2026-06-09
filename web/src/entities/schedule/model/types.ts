import { Weekday } from "@softtime/shared";

export type { Weekday };

export interface ScheduleDay {
  weekday: Weekday;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  autoCheckoutBuffer: number;
}

export interface EmployeeScheduleData {
  userId: string;
  days: ScheduleDay[];
}
