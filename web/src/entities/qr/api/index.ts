import { apiClient } from "@/shared/api/client";
import type { QrToken } from "../model/types";

export const qrApi = {
  list: () => apiClient.get<QrToken[]>("/qr").then((r) => r.data),

  generate: (location: string, networkId?: string) =>
    apiClient.post<QrToken>("/qr/generate", { location, networkId }).then((r) => r.data),

  regenerate: (id: string) => apiClient.post<QrToken>(`/qr/${id}/regenerate`).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/qr/${id}`).then((r) => r.data),
};
