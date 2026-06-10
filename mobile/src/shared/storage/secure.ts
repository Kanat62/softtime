import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'softtime_access_token',
  refreshToken: 'softtime_refresh_token',
} as const;

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.accessToken);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.refreshToken);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    ]);
  },
  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
    ]);
  },
};
