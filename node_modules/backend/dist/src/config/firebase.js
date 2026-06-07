"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFirebase = initFirebase;
exports.getMessaging = getMessaging;
const admin = require("firebase-admin");
let initialized = false;
function initFirebase(projectId, clientEmail, privateKey) {
    if (initialized)
        return;
    if (!projectId || !clientEmail || !privateKey)
        return;
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
    }
    initialized = true;
}
function getMessaging() {
    if (!initialized || admin.apps.length === 0)
        return null;
    return admin.messaging();
}
//# sourceMappingURL=firebase.js.map