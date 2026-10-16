import type { User } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

export async function getProfileApi(): Promise<User> {
  const res = await apiClient.get<User>('/profile');
  return res.data;
}

/**
 * Удаление своего аккаунта (App Store 5.1.1(v) / Google Play).
 * Подтверждение паролем уходит в теле DELETE-запроса. Сервер обезличивает
 * данные, а посещаемость оставляет для отчётов работодателя.
 */
export async function deleteMyAccountApi(password: string): Promise<void> {
  await apiClient.delete('/users/me', { data: { password } });
}
