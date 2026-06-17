import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTaxInfoApi } from '@/entities/user/api/profile';
import { queryKeys } from '@/shared/api/queryKeys';
import type { EmployeeTaxInfo } from '@softtime/shared';

export function useEditTaxInfo(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dto: EmployeeTaxInfo) => updateTaxInfoApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me() });
      onSuccess?.();
    },
  });

  return {
    save: mutation.mutate,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}
