import type { Attendance } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';
import { parseAttendance } from './attendance';

export interface AttendanceWithUser extends Attendance {
  user?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

function parseWithUser(raw: unknown): AttendanceWithUser {
  const r = raw as Record<string, unknown>;
  const base = parseAttendance(raw);
  return {
    ...base,
    user: r.user
      ? (r.user as AttendanceWithUser['user'])
      : undefined,
  };
}

/** GET /attendance/today — ADMIN-only. Returns open records (no checkOutAt). */
export async function getOfficeCurrentApi(): Promise<AttendanceWithUser[]> {
  const res = await apiClient.get<unknown[]>('/attendance/today');
  return res.data.map(parseWithUser);
}

/** PATCH /attendance/:id — set manual checkout time */
export async function manualCheckoutApi(
  attendanceId: string,
  checkOutAt: Date,
): Promise<Attendance> {
  const res = await apiClient.patch<unknown>(`/attendance/${attendanceId}`, {
    checkOutAt: checkOutAt.toISOString(),
  });
  return parseAttendance(res.data);
}
