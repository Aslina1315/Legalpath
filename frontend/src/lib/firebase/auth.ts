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
import { auth } from './firebase';

// ─── Google ─────────────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Opens the Google Sign-In popup.
 * Returns the UserCredential on success.
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
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
  const credential = await createUserWithEmailAndPassword(auth, email, password);
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
  return signInWithEmailAndPassword(auth, email, password);
}

// ─── Sign-out ────────────────────────────────────────────────────────────────

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

// ─── Error helpers ───────────────────────────────────────────────────────────

/**
 * Converts a Firebase Auth error code into a user-friendly message.
 */
export function authErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  };

  return messages[code] ?? 'An unexpected error occurred. Please try again.';
}
