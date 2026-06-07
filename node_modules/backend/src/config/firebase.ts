import * as admin from 'firebase-admin';

let initialized = false;

/**
 * Initialises Firebase Admin SDK once from env vars.
 * Safe to call multiple times — subsequent calls are no-ops.
 * When any FCM variable is absent the SDK is skipped and push notifications
 * will only be logged (graceful degradation for dev/test environments).
 */
export function initFirebase(
  projectId: string | undefined,
  clientEmail: string | undefined,
  privateKey: string | undefined,
): void {
  if (initialized) return;
  if (!projectId || !clientEmail || !privateKey) return;
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // .env may escape newlines as literal \n — restore them
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
  initialized = true;
}

/** Returns the Messaging instance or null when FCM is not configured. */
export function getMessaging(): admin.messaging.Messaging | null {
  if (!initialized || admin.apps.length === 0) return null;
  return admin.messaging();
}
