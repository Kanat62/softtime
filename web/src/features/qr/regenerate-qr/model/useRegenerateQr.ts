import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qrApi } from "@/entities/qr/api";
import { queryKeys } from "@/shared/api/query-keys";
import i18n from "@/shared/i18n";

export function useRegenerateQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (officeNetworkId?: string | null) => qrApi.regenerate(officeNetworkId),
    onSuccess: () => {
      toast.success(i18n.t("qr:toast.regenerated"));
      qc.invalidateQueries({ queryKey: queryKeys.qr });
    },
    onError: () => toast.error(i18n.t("qr:toast.regenFailed")),
  });
}
