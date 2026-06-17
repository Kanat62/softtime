import type { User, EmployeeTaxInfo } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

export async function getProfileApi(): Promise<User> {
  const res = await apiClient.get<User>('/profile');
  return res.data;
}

export async function updateTaxInfoApi(dto: EmployeeTaxInfo): Promise<User> {
  const res = await apiClient.patch<User>('/profile/tax-info', dto);
  return res.data;
}
