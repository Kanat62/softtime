import { apiClient } from '@/shared/api/client';
import type {
  AuthResponse,
  RegisterCompanyDto,
  RegisterWorkerDto,
  LoginDto,
  CompanyStatus,
  SubStatus,
} from '@softtime/shared';

export async function loginApi(dto: LoginDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', dto);
  return data;
}

export async function registerCompanyApi(dto: RegisterCompanyDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register/company', dto);
  return data;
}

export async function registerWorkerApi(dto: RegisterWorkerDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register/worker', dto);
  return data;
}

export async function logoutApi(fcmToken?: string): Promise<void> {
  await apiClient.post('/auth/logout', { fcmToken });
}

export async function refreshTokensApi(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await apiClient.post('/auth/refresh', { refreshToken });
  return data;
}

export interface MyCompanyResponse {
  id: string;
  name: string;
  companyCode: string;
  status: CompanyStatus;
  createdAt: string;
  subscription: {
    status: SubStatus;
    priceUsd: number;
    periodStart: string;
    periodEnd: string;
    nextBillingAt: string | null;
  } | null;
}

/** Fetches the ADMIN's own company. Pass a one-off access token to avoid
 *  touching global state (e.g. right after registration). */
export async function getMyCompanyApi(accessToken?: string): Promise<MyCompanyResponse> {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : undefined;
  const { data } = await apiClient.get<MyCompanyResponse>('/companies/me', config);
  return data;
}
