/**
 * Top navigation.
 * Shows brand name, auth state, and sign-in/sign-out controls.
 *
 * Stage 2: Full auth UI — Google Sign-In + user display + sign-out.
 */

'use client';

import { useState, useCallback } from 'react';
import { BRAND } from '@/tokens/design';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { AuthModal } from '@/components/auth/AuthModal';
import { signOut } from '@/lib/firebase/auth';

export function TopNav() {
  const { user, authLoading } = useAppStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = useCallback(async () => {
    setShowUserMenu(false);
    await signOut();
  }, []);

  const userInitial = user?.displayName
    ? user.displayName[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : '?';

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <nav
          className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"
          aria-label="Main navigation"
        >
          {/* Brand */}
          <a
            href="/"
            className="text-lg font-semibold text-neutral-900 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            aria-label={`${BRAND.name} — Home`}
          >
            {BRAND.name}
          </a>

          {/* Auth zone */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <span className="text-sm text-neutral-400" aria-live="polite">Loading…</span>
            ) : user ? (
              /* Signed-in: avatar + dropdown */
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    'bg-brand-500 text-white hover:bg-brand-600',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                  ].join(' ')}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label={`Account menu for ${user.displayName ?? user.email}`}
                >
                  {userInitial}
                </button>

                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden="true"
                      onClick={() => setShowUserMenu(false)}
                    />
                    {/* Menu */}
                    <div
                      className="absolute right-0 top-10 z-20 w-52 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                      role="menu"
                      aria-label="Account menu"
                    >
                      <div className="border-b border-neutral-100 px-3 py-2">
                        <p className="text-xs font-medium text-neutral-800 truncate">
                          {user.displayName ?? 'Your account'}
                        </p>
                        {user.email && (
                          <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                        )}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:bg-neutral-50"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Signed-out: Sign-in button */
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                type="button"
              >
                Sign in
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Auth modal — rendered at nav level so it's above everything */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
