import { useQuery } from '@tanstack/react-query';
import { getProfileApi } from '@/entities/user/api/profile';
import { queryKeys } from '@/shared/api/queryKeys';

export function useProfile() {
  const query = useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: getProfileApi,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
