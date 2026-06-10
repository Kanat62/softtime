export const queryKeys = {
  schedule: {
    me: () => ['schedule', 'me'] as const,
    user: (userId: string) => ['schedule', 'user', userId] as const,
  },
  attendance: {
    todayMe: () => ['attendance', 'today', 'me'] as const,
    todayInOffice: () => ['attendance', 'today', 'inOffice'] as const,
    todayAll: () => ['attendance', 'today', 'all'] as const,
    history: (from: string, to: string) => ['attendance', 'history', from, to] as const,
  },
  profile: {
    me: () => ['profile', 'me'] as const,
  },
  company: {
    me: () => ['company', 'me'] as const,
  },
  users: {
    list: (params: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  requests: {
    mine: (params: Record<string, unknown>) => ['requests', 'mine', params] as const,
    all: (params: Record<string, unknown>) => ['requests', 'all', params] as const,
  },
  news: {
    feed: (page: number) => ['news', 'feed', page] as const,
    detail: (id: string) => ['news', 'detail', id] as const,
  },
  subscription: {
    me: () => ['subscription', 'me'] as const,
  },
  payments: {
    list: (page: number) => ['payments', 'list', page] as const,
  },
};
