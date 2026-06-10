import { useQuery } from '@tanstack/react-query';
import { getMyRequestsApi } from '@/entities/request/api/requests';
import { queryKeys } from '@/shared/api/queryKeys';

export function useMyRequests() {
  const query = useQuery({
    queryKey: queryKeys.requests.mine({ page: 1 }),
    queryFn: () => getMyRequestsApi(1),
  });
  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
