import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attendanceApi } from "@/entities/attendance/api";
import type { ManualAttendanceDto } from "@/entities/attendance/model/types";

export function useAddAbsence(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ManualAttendanceDto) => attendanceApi.manualCreate(dto),
    onSuccess: () => {
      toast.success("Запись добавлена");
      qc.invalidateQueries({ queryKey: ["attendance"] });
      onSuccess?.();
    },
    onError: () => toast.error("Ошибка при добавлении"),
  });
}
