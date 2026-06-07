import * as admin from 'firebase-admin';
export declare function initFirebase(projectId: string | undefined, clientEmail: string | undefined, privateKey: string | undefined): void;
export declare function getMessaging(): admin.messaging.Messaging | null;
