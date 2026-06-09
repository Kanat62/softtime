import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { networkApi, type CreateNetworkDto, type UpdateNetworkDto } from "@/entities/office-network/api";
import { queryKeys } from "@/shared/api/query-keys";

export function useCreateOfficeNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNetworkDto) => networkApi.create(dto),
    onSuccess: () => {
      toast.success("Сеть добавлена");
      qc.invalidateQueries({ queryKey: queryKeys.officeNetworks });
    },
    onError: () => toast.error("Ошибка при добавлении"),
  });
}

export function useUpdateOfficeNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNetworkDto }) => networkApi.update(id, dto),
    onSuccess: () => {
      toast.success("Сеть обновлена");
      qc.invalidateQueries({ queryKey: queryKeys.officeNetworks });
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useRemoveOfficeNetwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: () => {
      toast.success("Сеть удалена");
      qc.invalidateQueries({ queryKey: queryKeys.officeNetworks });
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
