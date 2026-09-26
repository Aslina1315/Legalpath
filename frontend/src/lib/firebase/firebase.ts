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
  const missing: string[] = [];
  const placeholders: string[] = [];

  for (const key of requiredEnvVars) {
    const value = process.env[key];

    if (!value) {
      missing.push(key);
      continue;
    }

    if (
      value.includes('build-placeholder') ||
      value.includes('REPLACE_WITH_YOUR_') ||
      value.includes('REPLACE_WITH_LOCAL') ||
      value.includes('your-project') ||
      value.includes('placeholder')
    ) {
      placeholders.push(key);
    }
  }

  const invalid = [...missing, ...placeholders];
  if (invalid.length > 0) {
    throw new Error(
      `Missing or placeholder Firebase environment variables: ${invalid.join(', ')}. ` +
        'Add the real values to frontend/.env.local or the deployment environment before initializing Firebase.'
    );
  }
}

function createFirebaseApp(): FirebaseApp {
  validateFirebaseConfig();

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
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
