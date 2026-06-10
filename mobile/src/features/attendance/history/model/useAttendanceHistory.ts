import { useQuery } from '@tanstack/react-query';
import { DayStatus } from '@softtime/shared';
import { getMyAttendanceApi } from '@/entities/attendance/api/attendance';
import { queryKeys } from '@/shared/api/queryKeys';

export type Period = 'week' | 'month' | 'range';

function getDefaultRange(period: Exclude<Period, 'range'>): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (period === 'week') from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function useAttendanceHistory(
  period: Period,
  options: { customRange?: { from: string; to: string } } = {}
) {
  const { customRange } = options;

  let from: string;
  let to: string;

  if (period === 'range') {
    if (customRange) {
      from = customRange.from;
      to = customRange.to;
    } else {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);
      from = fromDate.toISOString().slice(0, 10);
      to = toDate.toISOString().slice(0, 10);
    }
  } else {
    const range = getDefaultRange(period);
    from = range.from;
    to = range.to;
  }

  const query = useQuery({
    queryKey: queryKeys.attendance.history(from, to),
    queryFn: () => getMyAttendanceApi(from, to),
  });

  const items = query.data ?? [];
  const totalMinutes = items.reduce((sum, a) => sum + (a.workedMinutes ?? 0), 0);
  const lateCount = items.filter((a) => a.status === DayStatus.LATE).length;
  const absentCount = items.filter((a) => a.status === DayStatus.ABSENT).length;

  return {
    items,
    totalMinutes,
    lateCount,
    absentCount,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
