/**
 * Firebase initialization tests.
 * Verifies module loads and basic shape without requiring real credentials.
 */

describe('Firebase config validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
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

  it('throws when required env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    await expect(import('@/lib/firebase/firebase')).rejects.toThrow(
      /Missing required Firebase environment variables/
    );
  });
});
