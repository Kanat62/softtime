import { Weekday } from '@softtime/shared';
import type { EmployeeSchedule } from '@softtime/shared';

export const mockSchedule: EmployeeSchedule[] = [
  { id: 'sch-mon', companyId: 'company-001', userId: 'user-worker-001', weekday: Weekday.MON, isWorkingDay: true,  startTime: '10:15', endTime: '18:00', autoCheckoutBuffer: 60 },
  { id: 'sch-tue', companyId: 'company-001', userId: 'user-worker-001', weekday: Weekday.TUE, isWorkingDay: true,  startTime: '10:15', endTime: '18:00', autoCheckoutBuffer: 60 },
  { id: 'sch-wed', companyId: 'company-001', userId: 'user-worker-001', weekday: Weekday.WED, isWorkingDay: true,  startTime: '10:15', endTime: '18:00', autoCheckoutBuffer: 60 },
  { id: 'sch-thu', companyId: 'company-001', userId: 'user-worker-001', weekday: Weekday.THU, isWorkingDay: true,  startTime: '10:15', endTime: '18:00', autoCheckoutBuffer: 60 },
  { id: 'sch-fri', companyId: 'company-001', userId: 'user-worker-001', weekday: Weekday.FRI, isWorkingDay: true,  startTime: '10:15', endTime: '18:00', autoCheckoutBuffer: 60 },
  { id: 'sch-sat', companyId: 'company-001', userId: 'user-worker-001', weekday: Weekday.SAT, isWorkingDay: true,  startTime: '12:00', endTime: '18:00', autoCheckoutBuffer: 60 },
  { id: 'sch-sun', companyId: 'company-001', userId: 'user-worker-001', weekday: Weekday.SUN, isWorkingDay: false, startTime: null,    endTime: null,    autoCheckoutBuffer: 60 },
];
