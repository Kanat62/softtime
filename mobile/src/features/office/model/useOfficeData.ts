import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getOfficeCurrentApi,
  manualCheckoutApi,
} from '@/entities/attendance/api/office';
import { queryKeys } from '@/shared/api/queryKeys';
import type { AppError } from '@/shared/api/errors';

export function useOfficeData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.attendance.todayInOffice(),
    queryFn: getOfficeCurrentApi,
    retry: (failureCount, error) => {
      // Don't retry on 403 (WORKER access denied)
      if ((error as unknown as AppError)?.statusCode === 403) return false;
      return failureCount < 1;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ id, checkOutAt }: { id: string; checkOutAt: Date }) =>
      manualCheckoutApi(id, checkOutAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.todayInOffice() });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.todayAll() });
    },
  });

  const isAccessDenied = (query.error as unknown as AppError | null)?.statusCode === 403;

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError && !isAccessDenied,
    isAccessDenied,
    refetch: query.refetch,
    checkoutMutation,
  };
}
