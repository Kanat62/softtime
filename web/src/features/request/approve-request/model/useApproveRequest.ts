import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestApi } from "@/entities/request/api";
import { queryKeys } from "@/shared/api/query-keys";
import { isNormalizedError } from "@/shared/api/error";
import i18n from "@/shared/i18n";

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => requestApi.approve(id),
    onSuccess: () => {
      toast.success(i18n.t("requests:toast.approved"));
      qc.invalidateQueries({ queryKey: queryKeys.requests({}) });
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : i18n.t("requests:toast.approveFailed");
      toast.error(msg);
    },
  });
}
