import { apiClient } from "@/shared/api/client";
import type { StoredInsight } from "../model/types";

export const insightApi = {
  get: () =>
    apiClient.get<StoredInsight>("/insights").then((r) => r.data),

  regenerate: () =>
    apiClient.post<StoredInsight>("/insights/regenerate").then((r) => r.data),
};
