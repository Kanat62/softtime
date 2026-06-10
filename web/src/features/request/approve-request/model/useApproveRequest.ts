import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestApi } from "@/entities/request/api";
import { queryKeys } from "@/shared/api/query-keys";
import { isNormalizedError } from "@/shared/api/error";

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => requestApi.approve(id),
    onSuccess: () => {
      toast.success("Заявка одобрена");
      qc.invalidateQueries({ queryKey: queryKeys.requests({}) });
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : "Ошибка при одобрении заявки";
      toast.error(msg);
    },
  });
}
