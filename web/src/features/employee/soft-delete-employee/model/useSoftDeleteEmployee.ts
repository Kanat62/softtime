import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userApi } from "@/entities/user/api";

export function useSoftDeleteEmployee(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.softDelete(id),
    onSuccess: () => {
      toast.success("Сотрудник удалён");
      qc.invalidateQueries({ queryKey: ["employees"] });
      onSuccess?.();
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
