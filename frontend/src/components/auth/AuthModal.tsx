/**
 * Auth Modal.
 * Google Sign-In (primary) + Email/Password (secondary).
 * Opens as a dialog overlay.
 *
 * Modes:
 *   'signin'  — sign in to existing account
 *   'signup'  — create new account
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, authErrorMessage } from '@/lib/firebase/auth';

// ─── Google Icon ─────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Form Input ───────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Input({ label, error, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </label>
      <input
        id={inputId}
        className={[
          'rounded-xl px-3 py-2.5 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
        style={{
          background: 'var(--color-bg-elevated)',
          border: `1px solid ${error ? 'rgba(248, 113, 113, 0.4)' : 'var(--color-border)'}`,
          color: 'var(--color-text-primary)',
        }}
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-trust-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** After successful auth, callback is called with the display name (if any) */
  onSuccess?: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setDisplayName('');
      setError(undefined);
      // Focus the first button after mount
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [isOpen, mode]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(authErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  }, [onClose, onSuccess]);

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName || undefined);
      } else {
        await signInWithEmail(email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(authErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  }, [mode, email, password, displayName, onClose, onSuccess]);

  if (!isOpen) return null;

  const title = mode === 'signup' ? 'Create your account' : 'Sign in to continue';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 focus:outline-none"
        style={{
          background: 'rgba(15, 16, 35, 0.95)',
          border: '1px solid var(--color-border-accent)',
          boxShadow: 'var(--glow-card-hover)',
        }}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="auth-modal-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Google Sign-In */}
        <Button
          ref={firstFocusRef}
          variant="outline"
          size="md"
          className="w-full gap-2"
          onClick={handleGoogleSignIn}
          isLoading={isLoading}
          disabled={isLoading}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or</span>
          <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3" noValidate>
          {mode === 'signup' && (
            <Input
              label="Your name"
              type="text"
              autoComplete="name"
              placeholder="Optional"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
            />
          )}

          <Input
            label="Email address"
            type="email"
            autoComplete={mode === 'signup' ? 'email' : 'username'}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />

          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          {error && (
            <p
              className="rounded-xl px-3 py-2 text-sm"
              role="alert"
              style={{
                background: 'rgba(248, 113, 113, 0.06)',
                border: '1px solid rgba(248, 113, 113, 0.15)',
                color: '#f87171',
              }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-1"
            isLoading={isLoading}
            loadingText={mode === 'signup' ? 'Creating account…' : 'Signing in…'}
            disabled={isLoading || !email || !password}
          >
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        {/* Mode toggle */}
        <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                style={{ color: '#a78bfa' }}
                type="button"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="font-medium text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                type="button"
              >
                Create one
              </button>
            </>
          )}
        </p>

        <VisuallyHidden>
          <p>
            Your information is protected. We use Firebase Authentication — we never store your password in plain text.
          </p>
        </VisuallyHidden>
      </div>
    </>
  );
}
