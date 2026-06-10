import { apiClient } from "@/shared/api/client";
import type { OfficeNetwork } from "../model/types";

export interface CreateNetworkDto {
  label: string;
  cidr: string;
}

export type UpdateNetworkDto = Partial<CreateNetworkDto>;

export const networkApi = {
  list: () =>
    apiClient.get<OfficeNetwork[]>("/office-networks").then((r) => r.data),

  create: (dto: CreateNetworkDto) =>
    apiClient.post<OfficeNetwork>("/office-networks", dto).then((r) => r.data),

  update: (id: string, dto: UpdateNetworkDto) =>
    apiClient.patch<OfficeNetwork>(`/office-networks/${id}`, dto).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<{ ok: boolean }>(`/office-networks/${id}`).then((r) => r.data),
};
