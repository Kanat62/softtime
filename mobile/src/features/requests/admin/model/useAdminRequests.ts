import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminRequestsApi,
  approveRequestApi,
  rejectRequestApi,
} from '@/entities/request/api/admin';

const QUERY_KEY = ['requests', 'admin'] as const;

export function useAdminRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAdminRequestsApi,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRequestApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string | null }) =>
      rejectRequestApi(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    approve: (id: string) => approveMutation.mutate(id),
    reject: (id: string, note?: string | null) =>
      rejectMutation.mutate({ id, note }),
    processingId: approveMutation.isPending
      ? approveMutation.variables
      : rejectMutation.isPending
        ? rejectMutation.variables?.id
        : null,
  };
}
