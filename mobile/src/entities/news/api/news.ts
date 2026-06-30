import type { News } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

export type NewsWithRead = News & { isRead: boolean };

export interface CreateNewsPayload {
  title: string;
  body: string;
}

interface PaginatedNews {
  data: unknown[];
  meta: { total: number; page: number; limit: number };
}

function parseNews(raw: unknown): NewsWithRead {
  const r = raw as Record<string, unknown>;
  return {
    ...(raw as unknown as NewsWithRead),
    createdAt: new Date(r.createdAt as string),
    isRead: Boolean(r.isRead),
  };
}

export async function getNewsFeedApi(page = 1): Promise<NewsWithRead[]> {
  const res = await apiClient.get<PaginatedNews>('/news', { params: { page, limit: 20 } });
  return res.data.data.map(parseNews);
}

export async function getNewsDetailApi(id: string): Promise<NewsWithRead> {
  const res = await apiClient.get<unknown>(`/news/${id}`);
  return parseNews(res.data);
}

export async function createNewsApi(payload: CreateNewsPayload): Promise<NewsWithRead> {
  const res = await apiClient.post<unknown>('/news', payload);
  return parseNews(res.data);
}
