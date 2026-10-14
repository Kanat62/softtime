import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscriptionApi } from "@/entities/subscription/api";
import { queryKeys } from "@/shared/api/query-keys";
import i18n from "@/shared/i18n";

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      toast.success(i18n.t("provider:subscriptionWidget.toast.cancelled"));
      qc.invalidateQueries({ queryKey: queryKeys.subscription });
    },
    onError: () => toast.error(i18n.t("provider:subscriptionWidget.toast.cancelFailed")),
  });
}
