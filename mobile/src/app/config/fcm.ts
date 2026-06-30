/**
 * Firebase Cloud Messaging — push notification setup.
 *
 * Requires:  expo install expo-notifications
 * Then add to app.json plugins:  ["expo-notifications", { "icon": "./assets/notification-icon.png" }]
 *
 * Uses a dynamic require so the module compiles even before the package is installed.
 * Once installed, all functionality activates automatically.
 */

import { Platform } from 'react-native';
import { registerFCMTokenApi } from '@/shared/api/notifications';

// Dynamic require — avoids compile error when expo-notifications is not yet installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Notif: any = (() => {
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
})();

/** Call once at app startup (before NavigationContainer mounts). */
export async function initFCM(): Promise<void> {
  if (!Notif) return;

  // Android: create a default notification channel
  if (Platform.OS === 'android') {
    await Notif.setNotificationChannelAsync('default', {
      name: 'Основные уведомления',
      importance: Notif.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1877F2',
    });
  }

  // Show alerts for foreground notifications (NotificationProvider handles routing)
  Notif.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Request permission (does nothing if already granted/denied)
  const { status } = await Notif.getPermissionsAsync();
  if (status !== 'granted') {
    await Notif.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
  }
}

/** Returns the native FCM/APNs device push token, or null if unavailable. */
export async function getFCMToken(): Promise<string | null> {
  if (!Notif) return null;
  try {
    const { status } = await Notif.getPermissionsAsync();
    if (status !== 'granted') return null;
    const result = await Notif.getDevicePushTokenAsync();
    return (result.data as string) ?? null;
  } catch {
    return null;
  }
}

/** Gets the token and POSTs it to the backend. Silently swallows errors. */
export async function registerFCMToken(): Promise<void> {
  const token = await getFCMToken();
  if (!token) return;
  try {
    await registerFCMTokenApi(token);
  } catch {
    // Token will be registered on the next successful request
  }
}

/** Subscribes a listener to background/killed notification taps.
 *  Returns an unsubscribe function. */
export function addNotificationTapListener(
  handler: (data: Record<string, unknown>) => void,
): () => void {
  if (!Notif) return () => {};
  const sub = Notif.addNotificationResponseReceivedListener(
    (response: { notification: { request: { content: { data: Record<string, unknown> } } } }) => {
      handler(response.notification.request.content.data);
    },
  );
  return () => sub.remove();
}

/** Subscribes a listener for notifications received while the app is foregrounded.
 *  Returns an unsubscribe function. */
export function addForegroundNotificationListener(
  handler: (data: Record<string, unknown>) => void,
): () => void {
  if (!Notif) return () => {};
  const sub = Notif.addNotificationReceivedListener(
    (notification: { request: { content: { data: Record<string, unknown> } } }) => {
      handler(notification.request.content.data);
    },
  );
  return () => sub.remove();
}
