import { apiClient } from "@/shared/api/client";
import type { News, NewsReaders, CreateNewsDto } from "../model/types";

export interface NewsFeed {
  data: News[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export const newsApi = {
  list: (page = 1, limit = 20) =>
    apiClient
      .get<NewsFeed>("/news", { params: { page, limit } })
      .then((r) => r.data),

  get: (id: string) => apiClient.get<News>(`/news/${id}`).then((r) => r.data),

  reads: (id: string) =>
    apiClient.get<NewsReaders>(`/news/${id}/reads`).then((r) => r.data),

  create: (dto: CreateNewsDto) =>
    apiClient.post<News>("/news", dto).then((r) => r.data),

  markRead: (id: string) =>
    apiClient.post<{ ok: boolean }>(`/news/${id}/read`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<{ ok: boolean }>(`/news/${id}`).then((r) => r.data),
};
