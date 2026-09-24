/**
 * Firebase Provider.
 * Initializes App Check once on client mount.
 * Must wrap the entire application.
 */

'use client';

import { useEffect } from 'react';
import { initAppCheck } from '@/lib/firebase/appCheck';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAppCheck();
  }, []);

  return <>{children}</>;
}
