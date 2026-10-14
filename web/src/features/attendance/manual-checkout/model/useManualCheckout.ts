import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attendanceApi } from "@/entities/attendance/api";
import i18n from "@/shared/i18n";

export function useManualCheckout(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attendanceId: string) =>
      attendanceApi.manualCheckout(attendanceId, new Date().toISOString()),
    onSuccess: () => {
      toast.success(i18n.t("attendance:toast.checkedOut"));
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["inOffice"] });
      onSuccess?.();
    },
    onError: () => toast.error(i18n.t("attendance:toast.checkoutFailed")),
  });
}
