/**
 * Firebase initialization tests.
 * Verifies validation behavior without importing the browser-only Firebase boot path.
 */

import { validateFirebaseConfig } from '@/lib/firebase/firebase';

describe('Firebase config validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123:web:abc';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('fails clearly when required Firebase config is missing', () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    expect(() => validateFirebaseConfig()).toThrow(
      'Missing or placeholder Firebase environment variables'
    );
  });

  it('fails clearly when placeholder Firebase config is present', () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'build-placeholder-key';

    expect(() => validateFirebaseConfig()).toThrow(
      'Missing or placeholder Firebase environment variables'
    );
  });
});
