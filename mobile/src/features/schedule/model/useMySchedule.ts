import { useQuery } from '@tanstack/react-query';
import { getMyScheduleApi } from '@/entities/schedule/api/schedule';
import { queryKeys } from '@/shared/api/queryKeys';

export function useMySchedule() {
  const query = useQuery({
    queryKey: queryKeys.schedule.me(),
    queryFn: getMyScheduleApi,
  });

  return {
    schedule: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
