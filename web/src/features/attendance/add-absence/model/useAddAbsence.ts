import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { attendanceApi } from "@/entities/attendance/api";
import type { ManualAttendanceDto } from "@/entities/attendance/model/types";
import i18n from "@/shared/i18n";

export function useAddAbsence(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ManualAttendanceDto) => attendanceApi.manualCreate(dto),
    onSuccess: () => {
      toast.success(i18n.t("attendance:toast.added"));
      qc.invalidateQueries({ queryKey: ["attendance"] });
      onSuccess?.();
    },
    onError: () => toast.error(i18n.t("attendance:toast.addFailed")),
  });
}
