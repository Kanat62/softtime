import { Platform } from 'react-native';
import { apiClient } from './client';

export async function registerFCMTokenApi(token: string): Promise<void> {
  await apiClient.post('/notifications/token', {
    token,
    platform: Platform.OS,
  });
}

export async function unregisterFCMTokenApi(token: string): Promise<void> {
  await apiClient.delete('/notifications/token', { data: { token } });
}
