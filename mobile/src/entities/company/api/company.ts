import type { CompanyMe } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

export async function getCompanyMeApi(): Promise<CompanyMe> {
  const res = await apiClient.get<CompanyMe>('/companies/me');
  return res.data;
}
