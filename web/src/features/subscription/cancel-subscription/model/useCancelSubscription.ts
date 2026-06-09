import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscriptionApi } from "@/entities/subscription/api";
import { queryKeys } from "@/shared/api/query-keys";

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      toast.success("Подписка отменена");
      qc.invalidateQueries({ queryKey: queryKeys.subscription });
    },
    onError: () => toast.error("Ошибка при отмене"),
  });
}
