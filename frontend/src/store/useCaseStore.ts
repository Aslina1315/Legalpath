/**
 * Case state — Zustand store.
 * Holds the continuous, evolving legal case draft and user interactions.
 */

import { create } from 'zustand';
import type { CaseDraft } from '@/types/case';
import type { UploadedEvidenceFile } from '@/lib/ai/evidenceAnalyzerModule';

interface CaseState {
  currentDraft: CaseDraft | null;
  narrativeInput: string;
  isSubmitting: boolean;
  caseId: string | null;
  uploadedFiles: UploadedEvidenceFile[];
  userClarifications: Record<string, string>;

  // Actions
  setNarrativeInput: (text: string) => void;
  setCurrentDraft: (draft: CaseDraft | null) => void;
  updateDraft: (patch: Partial<CaseDraft>) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setCaseId: (id: string | null) => void;
  addUploadedFile: (file: UploadedEvidenceFile) => void;
  removeUploadedFile: (index: number) => void;
  setUserClarification: (key: string, value: string) => void;
  clearDraft: () => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  currentDraft: null,
  narrativeInput: '',
  isSubmitting: false,
  caseId: null,
  uploadedFiles: [],
  userClarifications: {},

  setNarrativeInput: (text) => set({ narrativeInput: text }),
  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  updateDraft: (patch) =>
    set((state) => ({
      currentDraft: state.currentDraft ? { ...state.currentDraft, ...patch } : null,
    })),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setCaseId: (id) => set({ caseId: id }),
  addUploadedFile: (file) =>
    set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
  removeUploadedFile: (index) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
    })),
  setUserClarification: (key, value) =>
    set((state) => ({
      userClarifications: { ...state.userClarifications, [key]: value },
    })),
  clearDraft: () =>
    set({
      currentDraft: null,
      narrativeInput: '',
      caseId: null,
      uploadedFiles: [],
      userClarifications: {},
      isSubmitting: false,
    }),
}));
