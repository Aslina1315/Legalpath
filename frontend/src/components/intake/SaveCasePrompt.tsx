/**
 * SaveCasePrompt — shown after AI intake completes.
 *
 * If the user is signed in: automatically saves the case to Firestore.
 * If not signed in: shows a gentle nudge to sign in to save their work.
 *
 * This is a controlled component — parent decides when to render it.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AuthModal } from '@/components/auth/AuthModal';
import { createCase } from '@/lib/firebase/firestore';
import { useAppStore } from '@/store/useAppStore';
import { useCaseStore } from '@/store/useCaseStore';
import type { CaseDraft } from '@/types/case';

interface SaveCasePromptProps {
  draft: CaseDraft;
  onSaved?: (caseId: string) => void;
}

export function SaveCasePrompt({ draft, onSaved }: SaveCasePromptProps) {
  const router = useRouter();
  const { user } = useAppStore();
  const { setCaseId, caseId } = useCaseStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Auto-save when the user is already signed in
  useEffect(() => {
    if (user && !saved && !saving && !caseId) {
      handleSave(user.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSave(uid: string) {
    setSaving(true);
    setError(null);
    try {
      const id = await createCase(uid, draft);
      setCaseId(id);
      setSaved(true);
      onSaved?.(id);
      router.push(`/case/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // After auth completes, auto-save kicks in via useEffect above
  const handleAuthSuccess = () => {
    setShowAuth(false);
    // useEffect will pick up the new user from the store
  };

  if (saved || caseId) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-trust-green">
        <span aria-hidden="true">✓</span>
        <span>Case saved to your account</span>
      </div>
    );
  }

  if (saving) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-brand-600">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand-500" aria-hidden="true" />
        <span>Saving your case…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
        <span>{error}</span>
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSave(user.uid)}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Not signed in
  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-brand-700">Save your case</p>
          <p className="text-xs text-brand-500 mt-0.5">
            Sign in to save your progress and continue later.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAuth(true)}
          type="button"
        >
          Sign in to save
        </Button>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
