import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scheduleApi } from "@/entities/schedule/api";
import type { ScheduleDay } from "@/entities/schedule/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { isNormalizedError } from "@/shared/api/error";

export function useApplyScheduleToAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { days: ScheduleDay[]; userIds?: string[] }) =>
      scheduleApi.applyToAll(dto),
    onSuccess: () => {
      toast.success("Шаблон применён");
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : "Ошибка при применении шаблона";
      toast.error(msg);
    },
  });
}
