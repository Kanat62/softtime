import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestApi } from "@/entities/request/api";
import { queryKeys } from "@/shared/api/query-keys";

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      requestApi.reject(id, comment),
    onSuccess: () => {
      toast.success("Заявка отклонена");
      qc.invalidateQueries({ queryKey: queryKeys.requests({}) });
    },
    onError: () => toast.error("Ошибка при отклонении"),
  });
}
