import { DayStatus } from "@softtime/shared";

export type { DayStatus };

/** Matches backend AttendanceRecord (Prisma model) */
export interface AttendanceRow {
  id: string;
  userId: string;
  date: string;       // "YYYY-MM-DD"
  checkInAt: string | null;  // ISO datetime
  checkOutAt: string | null; // ISO datetime
  workedMinutes: number | null;
  status: DayStatus;
  isManual: boolean;
  note: string | null;
}

/** Matches POST /attendance/manual request body */
export interface ManualAttendanceDto {
  userId: string;
  date: string;       // "YYYY-MM-DD"
  status: DayStatus;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  note?: string;
}

/** Matches PATCH /attendance/:id request body */
export interface AttendancePatchDto {
  checkInAt?: string | null;
  checkOutAt?: string | null;
  status?: DayStatus;
  note?: string | null;
}
