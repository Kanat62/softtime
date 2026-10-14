import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { networkApi, type CreateNetworkDto, type UpdateNetworkDto } from "@/entities/office-network/api";
import { queryKeys } from "@/shared/api/query-keys";
import i18n from "@/shared/i18n";

export function useCreateOfficeNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNetworkDto) => networkApi.create(dto),
    onSuccess: () => {
      toast.success(i18n.t("networks:toast.added"));
      qc.invalidateQueries({ queryKey: queryKeys.officeNetworks });
    },
    onError: () => toast.error(i18n.t("networks:toast.addFailed")),
  });
}

export function useUpdateOfficeNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNetworkDto }) =>
      networkApi.update(id, dto),
    onSuccess: () => {
      toast.success(i18n.t("networks:toast.updated"));
      qc.invalidateQueries({ queryKey: queryKeys.officeNetworks });
    },
    onError: () => toast.error(i18n.t("networks:toast.updateFailed")),
  });
}

export function useRemoveOfficeNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: () => {
      toast.success(i18n.t("networks:toast.deleted"));
      qc.invalidateQueries({ queryKey: queryKeys.officeNetworks });
    },
    onError: () => toast.error(i18n.t("networks:toast.deleteFailed")),
  });
}
