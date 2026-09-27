/**
 * Auth helper unit tests.
 * Tests the error message mapping — Firebase auth functions are not called directly
 * (they require a live Firebase connection).
 */

import { authErrorMessage, resolveAuthErrorMessage } from '@/lib/firebase/auth';

// Mock Firebase so the module loads without real credentials
jest.mock('@/lib/firebase/firebase', () => ({
  app: { options: { projectId: 'test' } },
  auth: {},
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    addScope: jest.fn(),
  })),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
}));

describe('authErrorMessage', () => {
  it('returns a friendly message for invalid credential', () => {
    const msg = authErrorMessage('auth/invalid-credential');
    expect(msg).toMatch(/email or password is incorrect/i);
  });

  it('returns a friendly message for user-not-found', () => {
    const msg = authErrorMessage('auth/user-not-found');
    expect(msg).toMatch(/No account found with this email/i);
  });

  it('returns a friendly message for email-already-in-use', () => {
    const msg = authErrorMessage('auth/email-already-in-use');
    expect(msg).toMatch(/account with this email already exists/i);
  });

  it('returns a friendly message for invalid-email', () => {
    const msg = authErrorMessage('auth/invalid-email');
    expect(msg).toMatch(/valid email address/i);
  });

  it('returns a friendly message for weak-password', () => {
    const msg = authErrorMessage('auth/weak-password');
    expect(msg).toMatch(/6 characters/i);
  });

  it('returns a friendly message for operation-not-allowed', () => {
    const msg = authErrorMessage('auth/operation-not-allowed');
    expect(msg).toMatch(/not enabled/i);
  });

  it('returns a friendly message for configuration-not-found', () => {
    const msg = authErrorMessage('auth/configuration-not-found');
    expect(msg).toMatch(/not configured for this project/i);
  });

  it('returns a friendly message for invalid-api-key', () => {
    const msg = authErrorMessage('auth/invalid-api-key');
    expect(msg).toMatch(/configuration is invalid/i);
  });

  it('returns a friendly message for popup-closed-by-user', () => {
    const msg = authErrorMessage('auth/popup-closed-by-user');
    expect(msg).toMatch(/cancelled/i);
  });

  it('returns a generic message for unknown error codes', () => {
    const msg = authErrorMessage('auth/unknown-code-xyz');
    expect(msg).toMatch(/unexpected error/i);
  });

  it('returns the unavailable message when Firebase auth is unavailable', () => {
    const msg = resolveAuthErrorMessage(new Error('Firebase Authentication is currently unavailable. Please try again in a moment.'));
    expect(msg).toMatch(/currently unavailable/i);
  });

  it('returns a generic message for missing error code', () => {
    const msg = resolveAuthErrorMessage({ message: 'something else happened' });
    expect(msg).toMatch(/unexpected error/i);
  });

  it('returns a friendly message for unknown error object without code', () => {
    const msg = resolveAuthErrorMessage({ message: 'error' });
    expect(msg).toMatch(/unexpected error/i);
  });
});
