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
export async function deleteMyAccountApi(
  password: string,
  closeCompany = false,
): Promise<void> {
  // closeCompany отправляем только когда он true: без флага сервер не закроет
  // компанию, даже если по ошибке придёт что-то лишнее.
  await apiClient.delete('/users/me', {
    data: closeCompany ? { password, closeCompany: true } : { password },
  });
}
