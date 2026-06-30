import type { AbsenceRequest } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

export interface RequestWithUser extends AbsenceRequest {
  user?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

interface PaginatedRequests {
  data: unknown[];
  meta: { total: number; page: number; limit: number };
}

function parseRequestWithUser(raw: unknown): RequestWithUser {
  const r = raw as Record<string, unknown>;
  return {
    ...(raw as unknown as RequestWithUser),
    startDate: new Date(r.startDate as string),
    endDate: r.endDate ? new Date(r.endDate as string) : null,
    createdAt: new Date(r.createdAt as string),
    user: r.user as RequestWithUser['user'] | undefined,
  };
}

export async function getAdminRequestsApi(): Promise<RequestWithUser[]> {
  const res = await apiClient.get<PaginatedRequests>('/requests', {
    params: { limit: 50, page: 1 },
  });
  return res.data.data.map(parseRequestWithUser);
}

export async function approveRequestApi(id: string): Promise<void> {
  await apiClient.patch(`/requests/${id}/approve`);
}

export async function rejectRequestApi(id: string, note?: string | null): Promise<void> {
  await apiClient.patch(`/requests/${id}/reject`, { note: note ?? '' });
}
