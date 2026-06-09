import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userApi } from "@/entities/user/api";

export function useApproveEmployee(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.approveEmployee(id),
    onSuccess: () => {
      toast.success("Сотрудник принят");
      qc.invalidateQueries({ queryKey: ["employees"] });
      onSuccess?.();
    },
    onError: () => toast.error("Ошибка при принятии"),
  });
}
