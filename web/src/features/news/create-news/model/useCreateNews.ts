import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { newsApi } from "@/entities/news/api";
import type { CreateNewsDto } from "@/entities/news/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import i18n from "@/shared/i18n";

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNewsDto) => newsApi.create(dto),
    onSuccess: () => {
      toast.success(i18n.t("news:toast.published"));
      qc.invalidateQueries({ queryKey: queryKeys.news });
    },
    onError: () => toast.error(i18n.t("news:toast.publishFailed")),
  });
}
