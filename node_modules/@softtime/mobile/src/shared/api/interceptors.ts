import { apiClient } from './client';
import { tokenStorage } from '../storage/secure';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

export function setupInterceptors() {
  apiClient.interceptors.request.use(async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
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
        await tokenStorage.clear();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
