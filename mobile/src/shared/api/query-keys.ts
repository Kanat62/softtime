export const queryKeys = {
  user: {
    profile: ['user', 'profile'] as const,
  },
  company: {
    mine: ['company', 'mine'] as const,
  },
  attendance: {
    history: (params?: object) => ['attendance', 'history', params] as const,
    todayInOffice: ['attendance', 'today-in-office'] as const,
  },
  schedule: {
    mine: ['schedule', 'mine'] as const,
  },
  request: {
    mine: ['request', 'mine'] as const,
    incoming: ['request', 'incoming'] as const,
  },
  news: {
    feed: (params?: object) => ['news', 'feed', params] as const,
    detail: (id: string) => ['news', 'detail', id] as const,
  },
  subscription: {
    mine: ['subscription', 'mine'] as const,
    payments: ['subscription', 'payments'] as const,
  },
} as const;
