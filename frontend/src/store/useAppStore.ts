/**
 * Global application state — Zustand store.
 * Tracks auth state, AI processing state, and animation state.
 */

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { AIProcessingState } from '@/types/ai';
import type { SupportedLanguage } from '@/lib/i18n';

interface AppState {
  // Auth
  user: User | null;
  authLoading: boolean;

  // Language
  language: SupportedLanguage;

  // AI processing
  aiState: AIProcessingState;
  aiError: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setAIState: (state: AIProcessingState) => void;
  setAIError: (error: string | null) => void;
  resetAIState: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  authLoading: true,

  // Language
  language: 'en',

  // AI
  aiState: 'IDLE',
  aiError: null,

  // Actions
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setLanguage: (language) => set({ language }),
  setAIState: (state) => set({ aiState: state, aiError: null }),
  setAIError: (error) => set({ aiState: 'ERROR', aiError: error }),
  resetAIState: () => set({ aiState: 'IDLE', aiError: null }),
}));
