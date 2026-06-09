import { apiClient } from "@/shared/api/client";
import type { OfficeNetwork } from "../model/types";

export interface CreateNetworkDto {
  ssid: string;
  cidr: string;
  mode: "WHITELIST" | "BLOCKED";
}

export type UpdateNetworkDto = Partial<CreateNetworkDto>;

export const networkApi = {
  list: () => apiClient.get<OfficeNetwork[]>("/networks").then((r) => r.data),

  create: (dto: CreateNetworkDto) =>
    apiClient.post<OfficeNetwork>("/networks", dto).then((r) => r.data),

  update: (id: string, dto: UpdateNetworkDto) =>
    apiClient.patch<OfficeNetwork>(`/networks/${id}`, dto).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/networks/${id}`).then((r) => r.data),
};
