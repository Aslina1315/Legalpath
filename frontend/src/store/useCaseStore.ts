/**
 * Case state — Zustand store.
 * Holds the continuous, evolving legal case draft and user interactions.
 */

import { create } from 'zustand';
import type { CaseDraft } from '@/types/case';
import type { UploadedEvidenceFile } from '@/lib/ai/evidenceAnalyzerModule';
import type { DocumentDraftResult, BeforeSendReviewResult } from '@/types/ai';

interface CaseState {
  currentDraft: CaseDraft | null;
  narrativeInput: string;
  isSubmitting: boolean;
  caseId: string | null;
  uploadedFiles: UploadedEvidenceFile[];
  userClarifications: Record<string, string>;
  generatedDocument: DocumentDraftResult | null;
  beforeSendReview: BeforeSendReviewResult | null;
  userConfirmedDocument: boolean;

  // Actions
  setNarrativeInput: (text: string) => void;
  setCurrentDraft: (draft: CaseDraft | null) => void;
  updateDraft: (patch: Partial<CaseDraft>) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setCaseId: (id: string | null) => void;
  addUploadedFile: (file: UploadedEvidenceFile) => void;
  removeUploadedFile: (index: number) => void;
  setUserClarification: (key: string, value: string) => void;
  setGeneratedDocument: (doc: DocumentDraftResult | null) => void;
  updateDocumentSection: (sectionId: string, newContent: string) => void;
  setBeforeSendReview: (review: BeforeSendReviewResult | null) => void;
  setUserConfirmedDocument: (confirmed: boolean) => void;
  clearDraft: () => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  currentDraft: null,
  narrativeInput: '',
  isSubmitting: false,
  caseId: null,
  uploadedFiles: [],
  userClarifications: {},
  generatedDocument: null,
  beforeSendReview: null,
  userConfirmedDocument: false,

  setNarrativeInput: (text) => set({ narrativeInput: text }),
  setCurrentDraft: (draft) =>
    set({
      currentDraft: draft,
      generatedDocument: draft?.generatedDocument ?? null,
      beforeSendReview: draft?.beforeSendReview ?? null,
    }),
  updateDraft: (patch) =>
    set((state) => ({
      currentDraft: state.currentDraft ? { ...state.currentDraft, ...patch } : null,
      generatedDocument: patch.generatedDocument !== undefined ? patch.generatedDocument : state.generatedDocument,
      beforeSendReview: patch.beforeSendReview !== undefined ? patch.beforeSendReview : state.beforeSendReview,
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
  setGeneratedDocument: (doc) =>
    set((state) => ({
      generatedDocument: doc,
      userConfirmedDocument: false,
      currentDraft: state.currentDraft
        ? { ...state.currentDraft, generatedDocument: doc ?? undefined }
        : null,
    })),
  updateDocumentSection: (sectionId, newContent) =>
    set((state) => {
      if (!state.generatedDocument) return state;
      const updatedSections = state.generatedDocument.sections.map((s) =>
        s.id === sectionId ? { ...s, content: newContent } : s
      );
      const updatedDoc = { ...state.generatedDocument, sections: updatedSections };
      return {
        generatedDocument: updatedDoc,
        userConfirmedDocument: false, // Reset confirmation when text is modified
        currentDraft: state.currentDraft
          ? { ...state.currentDraft, generatedDocument: updatedDoc }
          : null,
      };
    }),
  setBeforeSendReview: (review) =>
    set((state) => ({
      beforeSendReview: review,
      currentDraft: state.currentDraft
        ? { ...state.currentDraft, beforeSendReview: review ?? undefined }
        : null,
    })),
  setUserConfirmedDocument: (confirmed) =>
    set({ userConfirmedDocument: confirmed }),
  clearDraft: () =>
    set({
      currentDraft: null,
      narrativeInput: '',
      caseId: null,
      uploadedFiles: [],
      userClarifications: {},
      isSubmitting: false,
      generatedDocument: null,
      beforeSendReview: null,
      userConfirmedDocument: false,
    }),
}));

