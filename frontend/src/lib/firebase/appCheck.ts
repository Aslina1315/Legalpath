/**
 * Firebase App Check initialization.
 *
 * LOCAL DEVELOPMENT:
 *   Set NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN in frontend/.env.local
 *   Generate this token in Firebase Console:
 *   Build → App Check → your web app → Manage debug tokens
 *
 * PRODUCTION:
 *   Set NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY (not required for local dev)
 *   Remove NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN from production env
 *
 * This module must be called ONCE at application startup (root layout).
 */

import { initializeAppCheck, CustomProvider, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { app, getFirebaseApp } from './firebase';

let appCheckInitialized = false;

export function initAppCheck(): void {
  if (typeof window === 'undefined') return; // Server-side: skip
  if (appCheckInitialized) return; // Already initialized

  const firebaseApp = app ?? getFirebaseApp();
  if (!firebaseApp) {
    console.warn('[AppCheck] Firebase is unavailable in this browser context; App Check was not initialized.');
    return;
  }

  const debugToken = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;

  if (debugToken) {
    (window as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      debugToken;

    initializeAppCheck(firebaseApp, {
      provider: new CustomProvider({
        getToken: async () => ({
          token: debugToken,
          expireTimeMillis: Date.now() + 3_600_000,
        }),
      }),
      isTokenAutoRefreshEnabled: true,
    });

    console.debug('[AppCheck] Initialized with debug token (development mode)');
  } else if (recaptchaKey) {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });

    console.debug('[AppCheck] Initialized with reCAPTCHA Enterprise (production mode)');
  } else {
    console.warn(
      '[AppCheck] Neither NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN nor NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is set. ' +
      'Firebase AI Logic calls will not be authorized. ' +
      'For local development, generate a debug token in the Firebase Console.'
    );
  }

  appCheckInitialized = true;
}
