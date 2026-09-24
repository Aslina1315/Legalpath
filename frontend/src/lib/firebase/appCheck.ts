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
import { app } from './firebase';

let appCheckInitialized = false;

export function initAppCheck(): void {
  if (typeof window === 'undefined') return; // Server-side: skip
  if (appCheckInitialized) return; // Already initialized

  const debugToken = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;

  if (debugToken) {
    // Development: inject debug token via Firebase's global mechanism
    // This is the documented Firebase approach for local development
    (window as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      debugToken;

    // Use a CustomProvider that returns the debug token
    initializeAppCheck(app, {
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
    // Production: reCAPTCHA Enterprise
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });

    console.debug('[AppCheck] Initialized with reCAPTCHA Enterprise (production mode)');
  } else {
    // Neither key provided: warn but don't crash
    // Firebase AI Logic calls will fail until App Check is configured
    console.warn(
      '[AppCheck] Neither NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN nor NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is set. ' +
      'Firebase AI Logic calls will not be authorized. ' +
      'For local development, generate a debug token in the Firebase Console.'
    );
  }

  appCheckInitialized = true;
}
