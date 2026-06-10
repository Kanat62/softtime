import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNewsApi, type CreateNewsPayload } from '@/entities/news/api/news';

export function useCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNewsPayload) => createNewsApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', 'feed'] });
    },
  });
}
