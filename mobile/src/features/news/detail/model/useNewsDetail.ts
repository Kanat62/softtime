import { useQuery } from '@tanstack/react-query';
import { getNewsDetailApi } from '@/entities/news/api/news';
import { queryKeys } from '@/shared/api/queryKeys';

export function useNewsDetail(id: string) {
  const query = useQuery({
    queryKey: queryKeys.news.detail(id),
    queryFn: () => getNewsDetailApi(id),
    enabled: !!id,
  });
  return {
    item: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
