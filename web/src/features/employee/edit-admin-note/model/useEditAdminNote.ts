import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userApi } from "@/entities/user/api";
import { queryKeys } from "@/shared/api/query-keys";

export function useEditAdminNote(employeeId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => userApi.updateNote(employeeId, note),
    onSuccess: () => {
      toast.success("Комментарий сохранён");
      qc.invalidateQueries({ queryKey: queryKeys.employee(employeeId) });
      onSuccess?.();
    },
    onError: () => toast.error("Не удалось сохранить комментарий"),
  });
}
