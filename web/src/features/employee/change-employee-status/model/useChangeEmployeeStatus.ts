import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserStatus } from "@softtime/shared";
import { userApi } from "@/entities/user/api";
import i18n from "@/shared/i18n";

export function useChangeEmployeeStatus(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userApi.changeStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(
        status === UserStatus.BLOCKED
          ? i18n.t("employees:toast.blocked")
          : i18n.t("employees:toast.activated"),
      );
      qc.invalidateQueries({ queryKey: ["employees"] });
      onSuccess?.();
    },
    onError: () => toast.error(i18n.t("employees:toast.statusFailed")),
  });
}
