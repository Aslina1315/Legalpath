/**
 * Auth Provider.
 * Subscribes to Firebase auth state and syncs to global store.
 */

'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase/firebase';
import { useAppStore } from '@/store/useAppStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthLoading } = useAppStore();

  useEffect(() => {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAuthLoading]);

  return <>{children}</>;
}
