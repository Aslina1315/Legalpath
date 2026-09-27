/**
 * Firebase Auth helpers.
 * Centralises all sign-in/sign-out logic so components stay thin.
 *
 * Supports:
 *   - Google Sign-In (popup)
 *   - Email + password (sign-up & sign-in)
 *   - Sign-out
 */

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type UserCredential,
} from 'firebase/auth';
import { getAuthInstance } from './firebase';

// ─── Google ─────────────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const FIREBASE_AUTH_UNAVAILABLE_MESSAGE = 'Firebase Authentication is currently unavailable. Please try again in a moment.';

export function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const code = 'code' in error ? error.code : undefined;
  return typeof code === 'string' && code.startsWith('auth/') ? code : null;
}

function logFirebaseAuthDebug(error: unknown, context: string): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const code = getFirebaseAuthErrorCode(error);
  const safeMessage = error instanceof Error ? error.message : 'Unknown Firebase auth error';
  console.warn(`[Firebase Auth][${context}]`, {
    code: code ?? 'unknown',
    message: safeMessage
      .replace(/AIza[0-9A-Za-z\-_]+/g, '[REDACTED_API_KEY]')
      .replace(/(Bearer\s+)[A-Za-z0-9\-_.]+/gi, '$1[REDACTED_TOKEN]')
      .slice(0, 180),
  });
}

/**
 * Opens the Google Sign-In popup.
 * Returns the UserCredential on success.
 */
function requireAuth(): NonNullable<ReturnType<typeof getAuthInstance>> {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    const unavailableError = new Error(FIREBASE_AUTH_UNAVAILABLE_MESSAGE);
    logFirebaseAuthDebug(unavailableError, 'auth-unavailable');
    throw unavailableError;
  }
  return authInstance;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(requireAuth(), googleProvider);
}

// ─── Email + Password ────────────────────────────────────────────────────────

/**
 * Creates a new account with email + password.
 * Optionally sets a display name.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const currentAuth = requireAuth();
  const credential = await createUserWithEmailAndPassword(currentAuth, email, password);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  return credential;
}

/**
 * Signs in with email + password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(requireAuth(), email, password);
}

// ─── Sign-out ────────────────────────────────────────────────────────────────

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  return firebaseSignOut(requireAuth());
}

// ─── Error helpers ───────────────────────────────────────────────────────────

/**
 * Converts a Firebase Auth error code into a user-friendly message.
 */
export function authErrorMessage(code?: string | null): string {
  const normalizedCode = typeof code === 'string' ? code.trim() : '';

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please enable it in Firebase Authentication.',
    'auth/configuration-not-found': 'Firebase Authentication is not configured for this project.',
    'auth/invalid-api-key': 'Firebase configuration is invalid. Please check the app configuration.',
    'auth/app-deleted': 'Firebase Authentication is not available for this app.',
    'auth/internal-error': 'Authentication is temporarily unavailable. Please try again in a moment.',
    'auth/invalid-password': 'The email or password is incorrect.',
    'auth/argument-error': 'The sign-in details are invalid. Please check the information and try again.',
  };

  if (!normalizedCode) {
    return 'An unexpected error occurred. Please try again.';
  }

  if (normalizedCode === 'auth/configuration-not-found' || normalizedCode === 'auth/invalid-api-key') {
    return messages[normalizedCode];
  }

  return messages[normalizedCode] ?? 'An unexpected error occurred. Please try again.';
}

export function resolveAuthErrorMessage(error: unknown): string {
  const code = getFirebaseAuthErrorCode(error);
  if (code) {
    logFirebaseAuthDebug(error, 'error-code');
    return authErrorMessage(code);
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message === FIREBASE_AUTH_UNAVAILABLE_MESSAGE) {
      logFirebaseAuthDebug(error, 'auth-unavailable');
      return message;
    }

    if (message.includes('Firebase Auth is unavailable') || message.includes('Firebase Authentication is currently unavailable')) {
      logFirebaseAuthDebug(error, 'auth-unavailable');
      return FIREBASE_AUTH_UNAVAILABLE_MESSAGE;
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    const message = error.message.trim();
    if (message.includes('Firebase Auth is unavailable') || message.includes('Firebase Authentication is currently unavailable')) {
      return FIREBASE_AUTH_UNAVAILABLE_MESSAGE;
    }
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    logFirebaseAuthDebug(error, 'unknown-auth-error');
  }

  return 'An unexpected error occurred. Please try again.';
}
