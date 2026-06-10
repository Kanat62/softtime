import { apiClient } from "@/shared/api/client";
import type { QrToken } from "../model/types";

export const qrApi = {
  getActive: (): Promise<QrToken | null> =>
    apiClient
      .get<QrToken>("/qr")
      .then((r) => r.data)
      .catch((err) => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),

  regenerate: (officeNetworkId?: string | null) =>
    apiClient
      .post<QrToken>("/qr/regenerate", { officeNetworkId: officeNetworkId ?? null })
      .then((r) => r.data),
};
