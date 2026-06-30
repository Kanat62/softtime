import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitRequestApi, type SubmitRequestPayload } from '@/entities/request/api/requests';
import { queryKeys } from '@/shared/api/queryKeys';

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitRequestPayload) => submitRequestApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'mine'] });
    },
  });
}
