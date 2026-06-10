import type { User } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

export async function getProfileApi(): Promise<User> {
  const res = await apiClient.get<User>('/profile');
  return res.data;
}
