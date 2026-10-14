import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestApi } from "@/entities/request/api";
import { queryKeys } from "@/shared/api/query-keys";
import { isNormalizedError } from "@/shared/api/error";
import i18n from "@/shared/i18n";

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      requestApi.reject(id, comment),
    onSuccess: () => {
      toast.success(i18n.t("requests:toast.rejected"));
      qc.invalidateQueries({ queryKey: queryKeys.requests({}) });
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : i18n.t("requests:toast.rejectFailed");
      toast.error(msg);
    },
  });
}
