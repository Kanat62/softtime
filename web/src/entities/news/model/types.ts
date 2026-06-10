export interface News {
  id: string;
  companyId: string;
  title: string;
  body: string;
  photoUrl?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface NewsReadEntry {
  userId: string;
  fullName: string;
  email: string;
  readAt: string;
}

export interface NewsReaders {
  stats: {
    total: number;
    readCount: number;
    unreadCount: number;
  };
  read: NewsReadEntry[];
  unread: { userId: string; fullName: string; email: string }[];
}

export interface CreateNewsDto {
  title: string;
  body: string;
  photoUrl?: string | null;
}
