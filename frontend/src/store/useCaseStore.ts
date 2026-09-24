/**
 * Case state — Zustand store.
 * Holds the current case being worked on.
 * Future: syncs with Firestore in real time.
 */

import { create } from 'zustand';
import type { CaseDraft } from '@/types/case';

interface CaseState {
  currentDraft: CaseDraft | null;
  narrativeInput: string;
  isSubmitting: boolean;
  caseId: string | null;

  // Actions
  setNarrativeInput: (text: string) => void;
  setCurrentDraft: (draft: CaseDraft | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setCaseId: (id: string | null) => void;
  clearDraft: () => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  currentDraft: null,
  narrativeInput: '',
  isSubmitting: false,
  caseId: null,

  setNarrativeInput: (text) => set({ narrativeInput: text }),
  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setCaseId: (id) => set({ caseId: id }),
  clearDraft: () => set({ currentDraft: null, narrativeInput: '', caseId: null }),
}));
