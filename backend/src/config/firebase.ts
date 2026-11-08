import admin from "firebase-admin";
import { getEnv } from "./env.js";

let initialized = false;

export function initFirebaseAdmin(): void {
  if (initialized) return;

  const env = getEnv();
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
  initialized = true;
}

export function getFirebaseAuth() {
  initFirebaseAdmin();
  return admin.auth();
}
