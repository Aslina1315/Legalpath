/**
 * Auth helper unit tests.
 * Tests the error message mapping — Firebase auth functions are not called directly
 * (they require a live Firebase connection).
 */

import { authErrorMessage } from '@/lib/firebase/auth';

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
  it('returns a friendly message for email-already-in-use', () => {
    const msg = authErrorMessage('auth/email-already-in-use');
    expect(msg).toMatch(/account with this email/i);
  });

  it('returns a friendly message for wrong-password', () => {
    const msg = authErrorMessage('auth/wrong-password');
    expect(msg).toMatch(/incorrect password/i);
  });

  it('returns a friendly message for weak-password', () => {
    const msg = authErrorMessage('auth/weak-password');
    expect(msg).toMatch(/6 characters/i);
  });

  it('returns a generic message for unknown error codes', () => {
    const msg = authErrorMessage('auth/unknown-code-xyz');
    expect(msg).toMatch(/unexpected error/i);
  });

  it('returns a message for popup-closed-by-user', () => {
    const msg = authErrorMessage('auth/popup-closed-by-user');
    expect(msg).toMatch(/cancelled/i);
  });
});
