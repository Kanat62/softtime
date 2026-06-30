import { apiClient } from './client';
import { normalizeError } from './errors';
import { tokenStorage } from '../storage/secure';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

export function setupInterceptors(onAuthFailure?: () => void) {
  // ── Request: attach access token ──────────────────────────────────────────
  apiClient.interceptors.request.use(async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ── Response: normalize errors + silent 401 refresh ───────────────────────
  // NOTE: The 401-refresh path is wired here so Block 3 only needs to supply
  // the `onAuthFailure` callback (navigation to Login) — no interceptor changes needed.
  apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;

      // Never retry the refresh endpoint itself — it would deadlock.
      if (
        error.response?.status !== 401 ||
        original._retry ||
        original.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        await tokenStorage.setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch (err) {
        processQueue(err, null);
        await tokenStorage.clearTokens();
        onAuthFailure?.();
        return Promise.reject(normalizeError(err));
      } finally {
        isRefreshing = false;
      }
    },
  );
}
