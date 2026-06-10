import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPendingUsersApi, approveUserApi, rejectUserApi } from '@/entities/user/api/admin';

const QUERY_KEY = ['employees', 'pending'] as const;

export function usePendingEmployees() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getPendingUsersApi,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveUserApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectUserApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    employees: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    approve: (id: string) => approveMutation.mutate(id),
    reject: (id: string) => rejectMutation.mutate(id),
    processingId: approveMutation.isPending
      ? approveMutation.variables
      : rejectMutation.isPending
        ? rejectMutation.variables
        : null,
  };
}
