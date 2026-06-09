import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scheduleApi } from "@/entities/schedule/api";
import type { ScheduleDay } from "@/entities/schedule/model/types";
import { queryKeys } from "@/shared/api/query-keys";

export function useEditSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: ScheduleDay[] }) =>
      scheduleApi.saveByUserId(userId, days),
    onSuccess: () => {
      toast.success("Расписание сохранено");
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: () => toast.error("Ошибка при сохранении"),
  });
}
