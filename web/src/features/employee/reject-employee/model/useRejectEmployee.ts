import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userApi } from "@/entities/user/api";

export function useRejectEmployee(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.rejectEmployee(id),
    onSuccess: () => {
      toast.success("Сотрудник отклонён");
      qc.invalidateQueries({ queryKey: ["employees"] });
      onSuccess?.();
    },
    onError: () => toast.error("Ошибка при отклонении"),
  });
}
