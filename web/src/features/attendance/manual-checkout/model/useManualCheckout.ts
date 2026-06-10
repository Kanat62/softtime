import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attendanceApi } from "@/entities/attendance/api";

export function useManualCheckout(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attendanceId: string) =>
      attendanceApi.manualCheckout(attendanceId, new Date().toISOString()),
    onSuccess: () => {
      toast.success("Уход отмечен");
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["inOffice"] });
      onSuccess?.();
    },
    onError: () => toast.error("Не удалось отметить уход"),
  });
}
