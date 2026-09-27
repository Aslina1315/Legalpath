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

import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

const firebaseConfigEnvMap = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
} as const;

export function validateFirebaseConfig(): void {
  const missing: string[] = [];
  const placeholders: string[] = [];

  for (const [key, value] of Object.entries(firebaseConfig)) {
    const envName = firebaseConfigEnvMap[key as keyof typeof firebaseConfigEnvMap];
    const trimmedValue = typeof value === 'string' ? value.trim() : '';

    if (!trimmedValue) {
      missing.push(envName);
      continue;
    }

    const normalizedValue = trimmedValue.toLowerCase();
    if (
      normalizedValue.includes('build-placeholder') ||
      normalizedValue.includes('replace_with_your_') ||
      normalizedValue.includes('replace_with_local') ||
      normalizedValue.includes('your-project') ||
      normalizedValue.includes('placeholder')
    ) {
      placeholders.push(envName);
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

let cachedApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  try {
    validateFirebaseConfig();
  } catch (error) {
    console.error('[Firebase] Firebase is not configured for this browser session.', error);
    return null;
  }

  const existingApp = getApps()[0];
  if (existingApp) {
    cachedApp = existingApp;
    return cachedApp;
  }

  const safeFirebaseConfig: FirebaseOptions = {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  };

  cachedApp = initializeApp(safeFirebaseConfig);
  return cachedApp;
}

export const app: FirebaseApp | null = null;

export function getAuthInstance(): Auth | null {
  const firebaseApp = getFirebaseApp();
  return firebaseApp ? getAuth(firebaseApp) : null;
}

export function getDbInstance(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  return firebaseApp ? getFirestore(firebaseApp) : null;
}

export const auth: Auth | null = null;
export const db: Firestore | null = null;
