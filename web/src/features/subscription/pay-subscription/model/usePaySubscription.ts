import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscriptionApi } from "@/entities/subscription/api";
import { queryKeys } from "@/shared/api/query-keys";

export function usePaySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.pay(),
    onSuccess: () => {
      toast.success("Подписка активирована");
      qc.invalidateQueries({ queryKey: queryKeys.subscription });
    },
    onError: () => toast.error("Ошибка при оплате"),
  });
}
