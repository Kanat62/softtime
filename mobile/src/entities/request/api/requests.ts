import type { AbsenceRequest } from '@softtime/shared';
import type { RequestType } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

function parseRequest(raw: unknown): AbsenceRequest {
  const r = raw as Record<string, unknown>;
  return {
    ...(raw as unknown as AbsenceRequest),
    startDate: new Date(r.startDate as string),
    endDate: r.endDate ? new Date(r.endDate as string) : null,
    createdAt: new Date(r.createdAt as string),
  };
}

export interface SubmitRequestPayload {
  type: RequestType;
  startDate: string;
  endDate?: string | null;
  desiredTime?: string | null;
  comment?: string | null;
}

interface PaginatedRequests {
  data: unknown[];
  meta: { total: number; page: number; limit: number };
}

export async function submitRequestApi(payload: SubmitRequestPayload): Promise<AbsenceRequest> {
  const res = await apiClient.post<unknown>('/requests', payload);
  return parseRequest(res.data);
}

export async function getMyRequestsApi(page = 1): Promise<AbsenceRequest[]> {
  const res = await apiClient.get<PaginatedRequests>('/requests/me', {
    params: { page, limit: 50 },
  });
  return res.data.data.map(parseRequest);
}
