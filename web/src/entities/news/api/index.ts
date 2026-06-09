import { apiClient } from "@/shared/api/client";
import type { News, NewsReaders, CreateNewsDto, UpdateNewsDto } from "../model/types";

export const newsApi = {
  list: () => apiClient.get<News[]>("/news").then((r) => r.data),

  get: (id: string) => apiClient.get<News>(`/news/${id}`).then((r) => r.data),

  readers: (id: string) => apiClient.get<NewsReaders>(`/news/${id}/readers`).then((r) => r.data),

  create: (dto: CreateNewsDto) => apiClient.post<News>("/news", dto).then((r) => r.data),

  update: (id: string, dto: UpdateNewsDto) =>
    apiClient.patch<News>(`/news/${id}`, dto).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/news/${id}`).then((r) => r.data),
};
