import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { tokenStore } from "./tokenStore";

let _refreshing = false;
type QueueEntry = (token: string | null) => void;
let _queue: QueueEntry[] = [];

function flushQueue(token: string | null) {
  _queue.forEach((fn) => fn(token));
  _queue = [];
}

let _initialized = false;

export function setupInterceptors(): void {
  if (_initialized) return;
  _initialized = true;

  // Attach access token to every outgoing request
  apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Silent refresh on 401
  apiClient.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Auth endpoints or already-retried requests — propagate as-is
      if (
        !axios.isAxiosError(error) ||
        error.response?.status !== 401 ||
        original._retry ||
        original.url?.includes("/auth/")
      ) {
        return Promise.reject(error);
      }

      // Queue concurrent requests while refresh is in flight
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _queue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      _refreshing = true;

      try {
        const { data } = await apiClient.post<{ accessToken: string }>("/auth/refresh");
        tokenStore.set(data.accessToken);
        flushQueue(data.accessToken);
        if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        tokenStore.set(null);
        flushQueue(null);
        // Force re-login only if not already on a public page
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")
        ) {
          window.location.replace("/login");
        }
        return Promise.reject(error);
      } finally {
        _refreshing = false;
      }
    },
  );
}
