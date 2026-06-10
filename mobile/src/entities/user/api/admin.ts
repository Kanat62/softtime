import type { User } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

interface PaginatedUsers {
  data: User[];
  meta: { total: number; page: number; limit: number };
}

export async function getPendingUsersApi(): Promise<User[]> {
  const res = await apiClient.get<PaginatedUsers>('/users', {
    params: { status: 'PENDING', limit: 50 },
  });
  return res.data.data;
}

export async function approveUserApi(id: string): Promise<void> {
  await apiClient.patch(`/users/${id}/approve`);
}

export async function rejectUserApi(id: string): Promise<void> {
  await apiClient.patch(`/users/${id}/reject`);
}
