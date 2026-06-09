import { apiClient } from "@/shared/api/client";
import type { Subscription } from "../model/types";

export const subscriptionApi = {
  get: () => apiClient.get<Subscription>("/subscription").then((r) => r.data),

  pay: () => apiClient.post<Subscription>("/subscription/pay").then((r) => r.data),

  cancel: () => apiClient.delete("/subscription/cancel").then((r) => r.data),
};
