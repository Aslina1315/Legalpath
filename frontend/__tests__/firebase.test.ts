/**
 * Firebase initialization tests.
 * Verifies browser-safe validation and initialization behavior for Firebase public env vars.
 */

async function loadFirebaseModule() {
  jest.resetModules();
  return import('@/lib/firebase/firebase');
}

describe('Firebase config validation', () => {
  const originalEnv = { ...process.env };

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
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('reads valid NEXT_PUBLIC_* values correctly and initializes in the browser', async () => {
    const { validateFirebaseConfig, getFirebaseApp } = await loadFirebaseModule();

    expect(() => validateFirebaseConfig()).not.toThrow();

    const firebaseApp = getFirebaseApp();
    expect(firebaseApp).not.toBeNull();
    expect(firebaseApp?.options.apiKey).toBe('test-api-key');
    expect(firebaseApp?.options.authDomain).toBe('test.firebaseapp.com');
    expect(firebaseApp?.options.projectId).toBe('test-project');
    expect(firebaseApp?.options.storageBucket).toBe('test.appspot.com');
    expect(firebaseApp?.options.messagingSenderId).toBe('123');
    expect(firebaseApp?.options.appId).toBe('1:123:web:abc');
  });

  it('does not blank-screen when required Firebase config is missing', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const { getFirebaseApp, validateFirebaseConfig } = await loadFirebaseModule();

    expect(() => validateFirebaseConfig()).toThrow('Missing or placeholder Firebase environment variables');
    expect(getFirebaseApp()).toBeNull();
  });

  it('does not initialize when placeholder Firebase config is present', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'build-placeholder-key';
    const { getFirebaseApp, validateFirebaseConfig } = await loadFirebaseModule();

    expect(() => validateFirebaseConfig()).toThrow('Missing or placeholder Firebase environment variables');
    expect(getFirebaseApp()).toBeNull();
  });

  it('does not initialize Firebase during SSR', async () => {
    const originalWindow = global.window;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    try {
      const { getFirebaseApp } = await loadFirebaseModule();
      expect(getFirebaseApp()).toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
  });
});
