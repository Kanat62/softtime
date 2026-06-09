import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestApi } from "@/entities/request/api";
import { queryKeys } from "@/shared/api/query-keys";

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      requestApi.approve(id, comment),
    onSuccess: () => {
      toast.success("Заявка одобрена");
      qc.invalidateQueries({ queryKey: queryKeys.requests({}) });
    },
    onError: () => toast.error("Ошибка при одобрении"),
  });
}
