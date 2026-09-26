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

  it('warns instead of crashing the browser when required env vars are missing', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    await expect(import('@/lib/firebase/firebase')).resolves.toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing Firebase environment variables')
    );

    warnSpy.mockRestore();
  });
});
