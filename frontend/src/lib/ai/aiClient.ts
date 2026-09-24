/**
 * Firebase AI Logic client.
 * Provides the initialized AI instance for all Gemini interactions.
 *
 * Uses Firebase AI Logic with Gemini Developer API backend.
 * The Gemini API key is managed by Firebase — never exposed in client code.
 */

import { getAI, GoogleAIBackend } from 'firebase/ai';
import { app } from '@/lib/firebase/firebase';

let _aiInstance: ReturnType<typeof getAI> | null = null;

/**
 * Returns the Firebase AI Logic instance.
 * Lazily initialized to avoid SSR issues.
 * App Check must be initialized before calling this in production.
 */
export function getAIInstance(): ReturnType<typeof getAI> {
  if (typeof window === 'undefined') {
    throw new Error('Firebase AI Logic must be called from a client context.');
  }

  if (!_aiInstance) {
    _aiInstance = getAI(app, { backend: new GoogleAIBackend() });
  }

  return _aiInstance;
}
