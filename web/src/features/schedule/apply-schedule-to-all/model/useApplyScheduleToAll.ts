import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scheduleApi } from "@/entities/schedule/api";
import type { ScheduleDay } from "@/entities/schedule/model/types";
import { queryKeys } from "@/shared/api/query-keys";

export function useApplyScheduleToAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { days: ScheduleDay[]; userIds?: string[] }) =>
      scheduleApi.applyTemplate(dto),
    onSuccess: () => {
      toast.success("Шаблон применён");
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: () => toast.error("Ошибка при применении"),
  });
}
