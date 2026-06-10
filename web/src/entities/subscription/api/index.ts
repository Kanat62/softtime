import { apiClient } from "@/shared/api/client";
import type { Subscription } from "../model/types";

export interface PayCheckoutResponse {
  checkoutUrl: string;
}

export const subscriptionApi = {
  get: () => apiClient.get<Subscription>("/subscriptions/me").then((r) => r.data),

  pay: () =>
    apiClient.post<PayCheckoutResponse>("/subscriptions/pay").then((r) => r.data),

  cancel: () => apiClient.post<Subscription>("/subscriptions/cancel").then((r) => r.data),
};
