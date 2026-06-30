import React, { useEffect } from 'react';
import { UserRole } from '@softtime/shared';
import { useAuth } from './AuthProvider';
import { navigationRef } from '@/shared/navigation/navigationRef';
import {
  initFCM,
  registerFCMToken,
  addNotificationTapListener,
} from '@/app/config/fcm';

// ─── Notification payload shape (matches backend push data) ──────────────────

type NotificationType =
  | 'registration_approved'
  | 'registration_rejected'
  | 'new_employee'
  | 'request_submitted'
  | 'request_approved'
  | 'request_rejected'
  | 'news_published'
  | 'subscription_expiring'
  | 'company_suspended';

interface PushData {
  type: NotificationType;
  id?: string;
}

// ─── Navigation helper ───────────────────────────────────────────────────────

function navigateFromNotification(data: PushData, userRole: UserRole | null) {
  if (!navigationRef.isReady()) return;

  const nav = navigationRef;

  switch (data.type) {
    case 'news_published':
      if (userRole === UserRole.ADMIN) {
        nav.navigate('AdminTabs' as never);
      } else {
        nav.navigate('WorkerTabs' as never);
      }
      break;

    case 'request_approved':
    case 'request_rejected':
      // Worker → Requests tab
      nav.navigate('WorkerTabs' as never);
      break;

    case 'request_submitted':
    case 'new_employee':
      // Admin → Management screen (inside Profile stack)
      nav.navigate('AdminTabs' as never);
      break;

    case 'subscription_expiring':
    case 'company_suspended':
      // Admin → Subscription screen
      nav.navigate('AdminTabs' as never);
      break;

    case 'registration_approved':
    case 'registration_rejected':
      // Status changed — RootNavigator guard re-evaluates on next token refresh
      break;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, userRole } = useAuth();

  // Init FCM on first mount
  useEffect(() => {
    initFCM().catch(() => {});
  }, []);

  // Register token whenever the user logs in
  useEffect(() => {
    if (accessToken) {
      registerFCMToken().catch(() => {});
    }
  }, [accessToken]);

  // Wire tap listener — routes user to the relevant screen
  useEffect(() => {
    const unsub = addNotificationTapListener((raw) => {
      const data = raw as unknown as PushData;
      navigateFromNotification(data, userRole);
    });
    return unsub;
  }, [userRole]);

  return <>{children}</>;
}
