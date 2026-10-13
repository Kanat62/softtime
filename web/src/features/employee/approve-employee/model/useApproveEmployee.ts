import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userApi } from "@/entities/user/api";
import i18n from "@/shared/i18n";

export function useApproveEmployee(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.approveEmployee(id),
    onSuccess: () => {
      toast.success(i18n.t("employees:toast.approved"));
      qc.invalidateQueries({ queryKey: ["employees"] });
      onSuccess?.();
    },
    onError: () => toast.error(i18n.t("employees:toast.approveFailed")),
  });
}
