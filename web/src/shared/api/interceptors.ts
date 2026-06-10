import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { tokenStore } from "./tokenStore";
import { refreshTokenStore } from "./refreshTokenStore";

let _initialized = false;
let _refreshing = false;
type QueueEntry = (token: string | null) => void;
let _queue: QueueEntry[] = [];

function flushQueue(token: string | null) {
  _queue.forEach((fn) => fn(token));
  _queue = [];
}

function redirectToLogin() {
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login") &&
    !window.location.pathname.startsWith("/register")
  ) {
    window.location.replace("/login");
  }
}

export function setupInterceptors(): void {
  if (_initialized) return;
  _initialized = true;

  // ── Request: attach Bearer token ────────────────────────────────────────────
  apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ── Response: 401 → silent refresh → retry once ────────────────────────────
  apiClient.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Skip non-401s, already-retried requests, and auth endpoints (prevents loops)
      if (
        error.response?.status !== 401 ||
        original?._retry ||
        original?.url?.includes("/auth/")
      ) {
        return Promise.reject(error);
      }

      // No stored refresh token — cannot refresh, send to login
      const storedRefresh = refreshTokenStore.get();
      if (!storedRefresh) {
        redirectToLogin();
        return Promise.reject(error);
      }

      // Queue concurrent 401s while a refresh is already in flight
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
        const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>(
          "/auth/refresh",
          { refreshToken: storedRefresh },
        );
        tokenStore.set(data.accessToken);
        refreshTokenStore.set(data.refreshToken);
        flushQueue(data.accessToken);
        if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        tokenStore.set(null);
        refreshTokenStore.clear();
        flushQueue(null);
        redirectToLogin();
        return Promise.reject(error);
      } finally {
        _refreshing = false;
      }
    },
  );
}
