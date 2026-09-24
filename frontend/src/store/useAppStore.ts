/**
 * Global application state — Zustand store.
 * Tracks auth state, AI processing state, and animation state.
 */

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { AIProcessingState } from '@/types/ai';

interface AppState {
  // Auth
  user: User | null;
  authLoading: boolean;

  // AI processing
  aiState: AIProcessingState;
  aiError: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAIState: (state: AIProcessingState) => void;
  setAIError: (error: string | null) => void;
  resetAIState: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  authLoading: true,

  // AI
  aiState: 'IDLE',
  aiError: null,

  // Actions
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setAIState: (state) => set({ aiState: state, aiError: null }),
  setAIError: (error) => set({ aiState: 'ERROR', aiError: error }),
  resetAIState: () => set({ aiState: 'IDLE', aiError: null }),
}));
