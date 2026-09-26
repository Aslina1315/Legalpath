/**
 * Top navigation — Premium dark glass header.
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
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

export function TopNav() {
  const { user, authLoading, language, setLanguage } = useAppStore();
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
      <header
        className="sticky top-0 z-30 w-full backdrop-blur-xl"
        style={{
          background: 'rgba(10, 11, 20, 0.75)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <nav
          className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"
          aria-label="Main navigation"
        >
          {/* Brand */}
          <a
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            aria-label={`${BRAND.name} — Home`}
          >
            {/* Brand icon */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: 'var(--gradient-brand)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span
              className="text-lg font-bold tracking-tight transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {BRAND.name}
            </span>
          </a>

          {/* Right zone: Language switcher + Auth */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div
              className="flex items-center rounded-lg p-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--color-border-subtle)',
              }}
              role="radiogroup"
              aria-label="Select language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    role="radio"
                    aria-checked={isSelected}
                    className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                      color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    }}
                    title={lang.label}
                  >
                    {lang.code.toUpperCase()}
                  </button>
                );
              })}
            </div>
            {authLoading ? (
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }} aria-live="polite">Loading…</span>
            ) : user ? (
              /* Signed-in: avatar + dropdown */
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
                  style={{
                    background: 'var(--gradient-brand)',
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                  }}
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
                      className="absolute right-0 top-12 z-20 w-56 rounded-xl py-1 backdrop-blur-xl"
                      role="menu"
                      aria-label="Account menu"
                      style={{
                        background: 'rgba(20, 22, 48, 0.92)',
                        border: '1px solid var(--color-border-accent)',
                        boxShadow: 'var(--glow-card-hover)',
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {user.displayName ?? 'Your account'}
                        </p>
                        {user.email && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                        )}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none"
                        role="menuitem"
                        style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                          e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }}
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
