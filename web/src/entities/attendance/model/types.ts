import { DayStatus } from "@softtime/shared";

export type { DayStatus };

export interface AttendanceRow {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  checkIn: string | null; // "HH:MM"
  checkOut: string | null; // "HH:MM"
  workedMinutes: number | null;
  status: DayStatus;
  isManual: boolean;
  note: string | null;
}

export interface InOfficeEmployee {
  attendanceId: string;
  userId: string;
  fullName: string;
  checkIn: string; // "HH:MM"
}

export interface AttendancePatchDto {
  checkIn?: string | null;
  checkOut?: string | null;
  note?: string | null;
}

export interface AbsenceCreateDto {
  userId: string;
  date: string; // "YYYY-MM-DD"
  status: DayStatus; // ABSENT | APPROVED_ABSENCE
  note: string;
}
