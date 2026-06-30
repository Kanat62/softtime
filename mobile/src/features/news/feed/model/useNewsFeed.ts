import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNewsFeedApi, type NewsWithRead } from '@/entities/news/api/news';
import { queryKeys } from '@/shared/api/queryKeys';

export function useNewsFeed() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.news.feed(1),
    queryFn: () => getNewsFeedApi(1),
  });

  function markReadOptimistic(id: string) {
    queryClient.setQueryData<NewsWithRead[]>(
      queryKeys.news.feed(1),
      (old) => old?.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    isError: query.isError,
    refetch: query.refetch,
    markReadOptimistic,
  };
}
