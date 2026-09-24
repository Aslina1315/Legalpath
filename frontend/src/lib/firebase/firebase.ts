/**
 * Firebase client initialization.
 * ALL configuration comes from NEXT_PUBLIC_ environment variables.
 * No credentials are hardcoded here.
 *
 * Required env vars (see .env.example at project root):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

function validateFirebaseConfig(): void {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    // In server-side static build (Next.js prerender), don't crash the build
    if (typeof window === 'undefined') {
      return;
    }
    throw new Error(
      `Missing required Firebase environment variables:\n${missing.join('\n')}\n` +
      `Copy .env.example to frontend/.env.local and fill in your Firebase project values.`
    );
  }
}

function createFirebaseApp(): FirebaseApp {
  validateFirebaseConfig();

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'build-placeholder-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'build-placeholder.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'build-placeholder',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'build-placeholder.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '0000000000',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:0000000000:web:placeholder',
  };

  // Prevent duplicate initialization (Next.js HMR)
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return initializeApp(firebaseConfig);
}

export const app: FirebaseApp = createFirebaseApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
