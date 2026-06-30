import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { getNewsFeedApi, type NewsWithRead } from '@/entities/news/api/news';
import { queryKeys } from '@/shared/api/queryKeys';

const READ_KEY = 'news_read_ids_v1';

async function loadReadIds(): Promise<Set<string>> {
  try {
    const raw = await SecureStore.getItemAsync(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function persistReadId(id: string): Promise<void> {
  try {
    const ids = await loadReadIds();
    ids.add(id);
    await SecureStore.setItemAsync(READ_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function useNewsFeed() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.news.feed(1),
    queryFn: async () => {
      const [items, readIds] = await Promise.all([getNewsFeedApi(1), loadReadIds()]);
      // Merge server isRead with locally persisted read IDs
      return items.map((n) => ({ ...n, isRead: n.isRead || readIds.has(n.id) }));
    },
  });

  function markReadOptimistic(id: string) {
    // Update cache immediately
    queryClient.setQueryData<NewsWithRead[]>(
      queryKeys.news.feed(1),
      (old) => old?.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    // Persist so it survives refresh
    persistReadId(id);
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
