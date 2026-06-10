import type { LinkingOptions } from '@react-navigation/native';
import type { RootParamList } from '@/shared/navigation/types';

export const linking: LinkingOptions<RootParamList> = {
  prefixes: ['softtime://', 'https://softtime.app'],
  config: {
    screens: {
      WorkerTabs: {
        screens: {
          Home: {
            screens: {
              AttendanceHistory: 'attendance/history',
              MySchedule: 'schedule',
              NewsDetail: 'news/:id',
            },
          },
          News: {
            screens: {
              NewsDetail: 'news/:id',
            },
          },
          Requests: {
            screens: {
              Requests: 'requests',
            },
          },
        },
      },
      AdminTabs: {
        screens: {
          Home: {
            screens: {
              AttendanceHistory: 'attendance/history',
              NewsDetail: 'news/:id',
            },
          },
          News: {
            screens: {
              NewsDetail: 'news/:id',
            },
          },
          Requests: {
            screens: {
              Requests: 'requests',
            },
          },
          Profile: {
            screens: {
              Management: 'management',
              Subscription: 'subscription',
            },
          },
        },
      },
    },
  },
};
