import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scheduleApi } from "@/entities/schedule/api";
import type { ScheduleDay } from "@/entities/schedule/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { isNormalizedError } from "@/shared/api/error";
import i18n from "@/shared/i18n";

export function useEditSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: ScheduleDay[] }) =>
      scheduleApi.saveByUserId(userId, days),
    onSuccess: () => {
      toast.success(i18n.t("schedules:toast.saved"));
      qc.invalidateQueries({ queryKey: queryKeys.schedules() });
    },
    onError: (err) => {
      const msg = isNormalizedError(err) ? err.message : i18n.t("schedules:toast.saveFailed");
      toast.error(msg);
    },
  });
}
