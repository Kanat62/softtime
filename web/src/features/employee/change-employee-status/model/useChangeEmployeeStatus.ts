import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserStatus } from "@softtime/shared";
import { userApi } from "@/entities/user/api";

export function useChangeEmployeeStatus(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userApi.changeStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(
        status === UserStatus.BLOCKED ? "Сотрудник заблокирован" : "Сотрудник активирован",
      );
      qc.invalidateQueries({ queryKey: ["employees"] });
      onSuccess?.();
    },
    onError: () => toast.error("Ошибка при изменении статуса"),
  });
}
