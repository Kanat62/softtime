export interface News {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  pinned?: boolean;
  photoUrl?: string | null;
  readCount?: number;
  totalEmployees?: number;
}

export interface NewsRead {
  newsId: string;
  userId: string;
  fullName: string;
  readAt: string;
}

export interface NewsReaders {
  read: NewsRead[];
  unread: { userId: string; fullName: string }[];
  total: number;
}

export interface CreateNewsDto {
  title: string;
  body: string;
  pinned?: boolean;
  photoUrl?: string | null;
}

export type UpdateNewsDto = Partial<CreateNewsDto>;
