import { useQuery } from '@tanstack/react-query';
import { getProfileApi } from '@/entities/user/api/profile';
import { getMyScheduleApi } from '@/entities/schedule/api/schedule';
import {
  getMyTodayAttendanceApi,
  getAttendanceTodaySummaryApi,
} from '@/entities/attendance/api/attendance';
import { queryKeys } from '@/shared/api/queryKeys';

export function useHomeData() {

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: getProfileApi,
  });

  const scheduleQuery = useQuery({
    queryKey: queryKeys.schedule.me(),
    queryFn: getMyScheduleApi,
  });

  const todayAttendanceQuery = useQuery({
    queryKey: queryKeys.attendance.todayMe(),
    queryFn: getMyTodayAttendanceApi,
  });

  const employeesTodayQuery = useQuery({
    queryKey: queryKeys.attendance.todayAll(),
    queryFn: getAttendanceTodaySummaryApi,
    retry: false,
  });

  const isLoading =
    profileQuery.isLoading ||
    scheduleQuery.isLoading ||
    todayAttendanceQuery.isLoading;

  const isError =
    profileQuery.isError &&
    scheduleQuery.isError &&
    todayAttendanceQuery.isError;

  function refetchAll() {
    profileQuery.refetch();
    scheduleQuery.refetch();
    todayAttendanceQuery.refetch();
    employeesTodayQuery.refetch();
  }

  return {
    profile: profileQuery.data ?? null,
    schedule: scheduleQuery.data ?? null,
    todayAttendance: todayAttendanceQuery.data ?? null,
    employeesToday: employeesTodayQuery.data ?? null,
    isLoading,
    isError,
    refetchAll,
  };
}
