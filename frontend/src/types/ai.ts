/**
 * AI processing state and response types.
 * These map to REAL backend/AI state changes — not fake timers.
 */

export type AIProcessingState =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'RESEARCHING'
  | 'ANALYZING'
  | 'COMPARING'
  | 'VERIFYING'
  | 'READY'
  | 'ERROR';

export interface AIStateMetadata {
  state: AIProcessingState;
  label: string;
  description: string;
  isTerminal: boolean;
  isError: boolean;
}

export const AI_STATE_METADATA: Record<AIProcessingState, AIStateMetadata> = {
  IDLE: {
    state: 'IDLE',
    label: 'Ready',
    description: 'Waiting for your input',
    isTerminal: false,
    isError: false,
  },
  UNDERSTANDING: {
    state: 'UNDERSTANDING',
    label: 'Understanding your situation',
    description: 'Reading and structuring what you shared',
    isTerminal: false,
    isError: false,
  },
  RESEARCHING: {
    state: 'RESEARCHING',
    label: 'Researching',
    description: 'Looking up relevant legal information',
    isTerminal: false,
    isError: false,
  },
  ANALYZING: {
    state: 'ANALYZING',
    label: 'Analyzing',
    description: 'Examining the details of your case',
    isTerminal: false,
    isError: false,
  },
  COMPARING: {
    state: 'COMPARING',
    label: 'Comparing information',
    description: 'Cross-referencing facts and documents',
    isTerminal: false,
    isError: false,
  },
  VERIFYING: {
    state: 'VERIFYING',
    label: 'Verifying',
    description: 'Checking accuracy and consistency',
    isTerminal: false,
    isError: false,
  },
  READY: {
    state: 'READY',
    label: 'Ready',
    description: 'Analysis complete',
    isTerminal: true,
    isError: false,
  },
  ERROR: {
    state: 'ERROR',
    label: 'Something went wrong',
    description: 'An error occurred during processing',
    isTerminal: true,
    isError: true,
  },
} as const;

/** Generic typed AI response wrapper */
export interface AIStructuredResponse<T> {
  data: T;
  model: string;
  generatedAt: string;
  promptTokens?: number;
  candidateTokens?: number;
}

/** Stream event from Firebase AI Logic generateContentStream */
export interface AIStreamChunk {
  text: string;
  isComplete: boolean;
  error?: string;
}

/** System readiness check response schema */
export interface SystemReadinessResponse {
  status: 'ok' | 'degraded';
  model: string;
  message: string;
  timestamp: string;
}
