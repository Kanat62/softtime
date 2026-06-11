import type { Attendance, CheckInResult, CheckOutResult } from '@softtime/shared';
import type { CheckInRequestDto } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseAttendance(raw: unknown): Attendance {
  const r = raw as Record<string, unknown>;
  return {
    ...(raw as unknown as Attendance),
    date: new Date(r.date as string),
    checkInAt: r.checkInAt ? new Date(r.checkInAt as string) : null,
    checkOutAt: r.checkOutAt ? new Date(r.checkOutAt as string) : null,
  };
}

export interface PaginatedAttendance {
  data: Attendance[];
  meta: { total: number; page: number; limit: number };
}

/** GET /attendance/me?from=YYYY-MM-DD&to=YYYY-MM-DD → all records in range */
export async function getMyAttendanceApi(from: string, to: string): Promise<Attendance[]> {
  const res = await apiClient.get<PaginatedAttendance>('/attendance/me', {
    params: { from, to, limit: 100, page: 1 },
  });
  return res.data.data.map(parseAttendance);
}

/** GET /attendance/me?from=today&to=today → single today record or null */
export async function getMyTodayAttendanceApi(): Promise<Attendance | null> {
  const today = todayIso();
  const res = await apiClient.get<PaginatedAttendance>('/attendance/me', {
    params: { from: today, to: today, limit: 1 },
  });
  const raw = res.data.data[0];
  return raw ? parseAttendance(raw) : null;
}

export interface AttendanceTodaySummary {
  inOffice: number;
  left: number;
  total: number;
}

/**
 * ADMIN-only: GET /attendance?from=today&to=today
 * Derives inOffice (checked in, not checked out) and left (checked out) counts.
 * Returns 403 for WORKER — callers must handle the error.
 */
export async function getAttendanceTodaySummaryApi(): Promise<AttendanceTodaySummary> {
  const today = todayIso();
  const res = await apiClient.get<PaginatedAttendance>('/attendance', {
    params: { from: today, to: today, limit: 200 },
  });
  const records = res.data.data;
  const inOffice = records.filter((r) => r.checkInAt && !r.checkOutAt).length;
  const left = records.filter((r) => r.checkInAt && r.checkOutAt).length;
  return { inOffice, left, total: inOffice + left };
}

/** POST /attendance/check-in */
export async function checkInApi(dto: CheckInRequestDto): Promise<CheckInResult> {
  const res = await apiClient.post<CheckInResult>('/attendance/check-in', dto);
  const raw = res.data as unknown as Record<string, unknown>;
  return {
    ...(res.data as CheckInResult),
    record: parseAttendance(raw.record),
  };
}

/** DELETE /attendance/today/me — удалить запись за сегодня */
export async function clearTodayAttendanceApi(): Promise<void> {
  await apiClient.delete('/attendance/today/me');
}

/** POST /attendance/check-out */
export async function checkOutApi(dto: CheckInRequestDto): Promise<CheckOutResult> {
  const res = await apiClient.post<CheckOutResult>('/attendance/check-out', dto);
  const raw = res.data as unknown as Record<string, unknown>;
  return {
    ...(res.data as CheckOutResult),
    record: parseAttendance(raw.record),
  };
}
