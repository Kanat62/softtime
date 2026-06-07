const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const env = {
  apiBaseUrl: API_BASE_URL,
} as const;
