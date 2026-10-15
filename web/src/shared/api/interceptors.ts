import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { tokenStore } from "./tokenStore";
import { refreshTokenStore, REFRESH_TOKEN_KEY } from "./refreshTokenStore";
import { refreshTokensUnderLock } from "./refreshSession";
import i18n from "@/shared/i18n";

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

  // ── Выход в другой вкладке ──────────────────────────────────────────────────
  // Событие storage приходит только в ОСТАЛЬНЫЕ вкладки. Токен исчез
  // (removeItem даёт newValue === null, clear() даёт key === null) — значит
  // в одной из вкладок вышли из системы, здесь сессии тоже больше нет.
  // На обновление токена не реагируем: там newValue не null.
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      const removed = e.key === null || (e.key === REFRESH_TOKEN_KEY && e.newValue === null);
      if (!removed) return;
      tokenStore.set(null);
      redirectToLogin();
    });
  }

  // ── Request: attach Bearer token + UI language ──────────────────────────────
  apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // По нему бэкенд переводит details[].message у ошибок валидации.
    // Читаем язык на каждом запросе — он меняется без перезагрузки страницы.
    config.headers["Accept-Language"] = i18n.resolvedLanguage ?? i18n.language;
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
        // Блокировка и повторное чтение токена — внутри помощника.
        const data = await refreshTokensUnderLock();

        // null — пока мы ждали очередь, соседняя вкладка вышла из системы.
        if (!data) {
          tokenStore.set(null);
          flushQueue(null);
          redirectToLogin();
          return Promise.reject(error);
        }

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
