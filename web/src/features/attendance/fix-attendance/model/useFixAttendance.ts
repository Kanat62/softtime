import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attendanceApi } from "@/entities/attendance/api";
import type { AttendancePatchDto } from "@/entities/attendance/model/types";

export function useFixAttendance(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AttendancePatchDto }) =>
      attendanceApi.patchRecord(id, dto),
    onSuccess: () => {
      toast.success("Запись обновлена");
      qc.invalidateQueries({ queryKey: ["attendance"] });
      onSuccess?.();
    },
    onError: () => toast.error("Ошибка при сохранении"),
  });
}
