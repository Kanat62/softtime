import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qrApi } from "@/entities/qr/api";
import { queryKeys } from "@/shared/api/query-keys";

export function useRegenerateQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qrApi.regenerate(id),
    onSuccess: () => {
      toast.success("QR-код обновлён");
      qc.invalidateQueries({ queryKey: queryKeys.qr });
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}
