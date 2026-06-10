import type { AxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { normalizeError } from "./error";

/**
 * Typed HTTP helper for feature api layers.
 * Wraps apiClient so call sites get `T` directly and never deal with raw AxiosResponse.
 * All errors are normalized to NormalizedError before being re-thrown.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
