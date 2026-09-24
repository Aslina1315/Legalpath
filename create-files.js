const fs = require('fs');
const path = require('path');

const root = "C:\\Users\\DELL\\Downloads\\PROMPT WARS EXCLUSIVE\\frontend";

const files = {
  "package.json": `{
  "name": "legal-ai-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "firebase": "^10.14.1",
    "zustand": "^5.0.0",
    "zod": "^3.23.8",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.29",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "ts-jest": "^29.2.5"
  }
}`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
  "next.config.ts": `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prepare for future API route proxying
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: \`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/:path*\`,
      },
    ];
  },
};

export default nextConfig;`,
  "tailwind.config.ts": `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d0ff',
          300: '#9db0ff',
          400: '#7488ff',
          500: '#4f62f5',
          600: '#3d47ea',
          700: '#3337cf',
          800: '#2b2ea7',
          900: '#272c84',
          950: '#191b4e',
        },
        neutral: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#a0a0a0',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        trust: {
          green: '#16a34a',
          amber: '#d97706',
          red: '#dc2626',
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.35s ease-out forwards',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;`,
  "postcss.config.js": `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
  ".eslintrc.json": `{
  "extends": ["next/core-web-vitals", "next/typescript"]
}`,
  "jest.config.ts": `import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customJestConfig: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(customJestConfig);`,
  "jest.setup.ts": `import '@testing-library/jest-dom';`,
  "src/tokens/design.ts": `/**
 * Design tokens — single source of truth for brand, color, and spacing.
 * The brand name "LegalPath" is a temporary placeholder.
 * To rebrand: update BRAND.name and BRAND.tagline here only.
 */

export const BRAND = {
  name: 'LegalPath',
  tagline: 'Tell us what happened. Understand what matters. Know what to do next.',
  shortDescription: 'AI-assisted legal access for everyone.',
} as const;

export const COLORS = {
  brand: {
    primary: '#4f62f5',
    primaryDark: '#3337cf',
    primaryLight: '#9db0ff',
    surface: '#f0f4ff',
  },
  neutral: {
    background: '#ffffff',
    surface: '#f8f8f8',
    border: '#e4e4e4',
    text: {
      primary: '#171717',
      secondary: '#525252',
      muted: '#a0a0a0',
    },
  },
  trust: {
    green: '#16a34a',
    amber: '#d97706',
    red: '#dc2626',
  },
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const TYPOGRAPHY = {
  fontSizeBase: '1rem',
  fontSizeSm: '0.875rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  fontSizeDisplay: 'clamp(1.75rem, 4vw, 3rem)',
  lineHeightBody: '1.6',
  lineHeightHeading: '1.2',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
} as const;

export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;`,
  "src/types/ai.ts": `/**
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
}`,
  "src/types/case.ts": `/**
 * Case model — typed interface for the future Firestore case document.
 * Fields are optional where they will be populated in later AI pipeline stages.
 */

export type CaseStatus =
  | 'DRAFT'
  | 'INTAKE'
  | 'ANALYZING'
  | 'STRUCTURED'
  | 'ACTION_READY'
  | 'CLOSED'
  | 'ARCHIVED';

export interface CaseTimestamps {
  createdAt: string; // ISO 8601
  updatedAt: string;
  intakeCompletedAt?: string;
  analysisCompletedAt?: string;
  closedAt?: string;
}

export interface StructuredFact {
  id: string;
  text: string;
  confidence: number; // 0–1
  sourceNarrativeOffset?: number;
}

export interface CaseEntity {
  id: string;
  name: string;
  role: 'CLAIMANT' | 'RESPONDENT' | 'WITNESS' | 'THIRD_PARTY' | 'INSTITUTION' | 'OTHER';
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  date?: string;
  approximateDate?: string;
  description: string;
  confidence: number;
}

export interface Evidence {
  id: string;
  type: 'DOCUMENT' | 'PHOTO' | 'VIDEO' | 'COMMUNICATION' | 'TESTIMONY' | 'OTHER';
  description: string;
  status: 'AVAILABLE' | 'MISSING' | 'PARTIAL';
  storageRef?: string; // Firebase Storage path, future
}

export interface EvidenceGap {
  id: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestion?: string;
}

export interface Contradiction {
  id: string;
  description: string;
  itemARef: string;
  itemBRef: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface LegalSource {
  id: string;
  title: string;
  url?: string;
  jurisdiction?: string;
  relevanceScore?: number;
  retrievedAt: string;
}

export interface VerificationRecord {
  id: string;
  claim: string;
  verified: boolean;
  confidence: number;
  sources: string[];
  notes?: string;
}

export interface ActionItem {
  id: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  deadline?: string;
  completed: boolean;
}

export interface GeneratedDocument {
  id: string;
  type: string;
  title: string;
  storageRef?: string; // Firebase Storage path, future
  generatedAt: string;
  version: number;
}

/** Root case document — mirrors future Firestore document structure */
export interface Case {
  caseId: string;
  userId: string;
  jurisdiction?: string;
  narrative: string;
  status: CaseStatus;
  timestamps: CaseTimestamps;

  // Populated by AI pipeline stages
  structuredFacts?: StructuredFact[];
  entities?: CaseEntity[];
  timeline?: TimelineEvent[];
  evidence?: Evidence[];
  gaps?: EvidenceGap[];
  contradictions?: Contradiction[];
  sources?: LegalSource[];
  verification?: VerificationRecord[];
  actionPlan?: ActionItem[];
  documents?: GeneratedDocument[];

  // Metadata
  language?: string; // BCP-47 language tag
  aiPipelineVersion?: string;
}

/** Partial case used during intake before caseId is assigned */
export type CaseDraft = Omit<Case, 'caseId' | 'userId'> & {
  caseId?: string;
  userId?: string;
};`,
  "src/lib/firebase/firebase.ts": `/**
 * Firebase client initialization.
 * ALL configuration comes from NEXT_PUBLIC_ environment variables.
 * No credentials are hardcoded here.
 *
 * Required env vars (see .env.example at project root):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

function validateFirebaseConfig(): void {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    throw new Error(
      \`Missing required Firebase environment variables:\\n\${missing.join('\\n')}\\n\` +
      \`Copy .env.example to frontend/.env.local and fill in your Firebase project values.\`
    );
  }
}

function createFirebaseApp(): FirebaseApp {
  validateFirebaseConfig();

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  // Prevent duplicate initialization (Next.js HMR)
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return initializeApp(firebaseConfig);
}

export const app: FirebaseApp = createFirebaseApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);`,
  "src/lib/firebase/appCheck.ts": `/**
 * Firebase App Check initialization.
 *
 * LOCAL DEVELOPMENT:
 *   Set NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN in frontend/.env.local
 *   Generate this token in Firebase Console:
 *   Build → App Check → your web app → Manage debug tokens
 *
 * PRODUCTION:
 *   Set NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY (not required for local dev)
 *   Remove NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN from production env
 *
 * This module must be called ONCE at application startup (root layout).
 */

import { initializeAppCheck, CustomProvider, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { app } from './firebase';

let appCheckInitialized = false;

export function initAppCheck(): void {
  if (typeof window === 'undefined') return; // Server-side: skip
  if (appCheckInitialized) return; // Already initialized

  const debugToken = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;

  if (debugToken) {
    // Development: inject debug token via Firebase's global mechanism
    // This is the documented Firebase approach for local development
    (window as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      debugToken;

    // Use a CustomProvider that returns the debug token
    initializeAppCheck(app, {
      provider: new CustomProvider({
        getToken: async () => ({
          token: debugToken,
          expireTimeMillis: Date.now() + 3_600_000,
        }),
      }),
      isTokenAutoRefreshEnabled: true,
    });

    console.debug('[AppCheck] Initialized with debug token (development mode)');
  } else if (recaptchaKey) {
    // Production: reCAPTCHA Enterprise
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });

    console.debug('[AppCheck] Initialized with reCAPTCHA Enterprise (production mode)');
  } else {
    // Neither key provided: warn but don't crash
    // Firebase AI Logic calls will fail until App Check is configured
    console.warn(
      '[AppCheck] Neither NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN nor NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY is set. ' +
      'Firebase AI Logic calls will not be authorized. ' +
      'For local development, generate a debug token in the Firebase Console.'
    );
  }

  appCheckInitialized = true;
}`,
  "src/lib/ai/aiClient.ts": `/**
 * Firebase AI Logic client.
 * Provides the initialized AI instance for all Gemini interactions.
 *
 * Uses Firebase AI Logic with Gemini Developer API backend.
 * The Gemini API key is managed by Firebase — never exposed in client code.
 */

import { getAI, GoogleAIBackend } from 'firebase/ai';
import { app } from '@/lib/firebase/firebase';

let _aiInstance: ReturnType<typeof getAI> | null = null;

/**
 * Returns the Firebase AI Logic instance.
 * Lazily initialized to avoid SSR issues.
 * App Check must be initialized before calling this in production.
 */
export function getAIInstance(): ReturnType<typeof getAI> {
  if (typeof window === 'undefined') {
    throw new Error('Firebase AI Logic must be called from a client context.');
  }

  if (!_aiInstance) {
    _aiInstance = getAI(app, { backend: new GoogleAIBackend() });
  }

  return _aiInstance;
}`,
  "src/lib/ai/models.ts": `/**
 * Model configuration registry.
 * Centralizes Gemini model selection and generation parameters.
 */

import type { GenerationConfig, SafetySetting } from 'firebase/ai';
import { HarmBlockThreshold, HarmCategory } from 'firebase/ai';

export type ModelName = 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export interface ModelConfig {
  model: ModelName;
  generationConfig: GenerationConfig;
  safetySettings: SafetySetting[];
}

/** Conservative safety settings for a legal context */
const legalSafetySettings: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/** Default model for most AI tasks */
export const DEFAULT_MODEL: ModelConfig = {
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.2,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
  safetySettings: legalSafetySettings,
};

/** Structured output model — JSON mode */
export const STRUCTURED_MODEL: ModelConfig = {
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.1,
    topP: 0.9,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  },
  safetySettings: legalSafetySettings,
};

/** System readiness check — lightweight */
export const READINESS_MODEL: ModelConfig = {
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.0,
    maxOutputTokens: 256,
    responseMimeType: 'application/json',
  },
  safetySettings: legalSafetySettings,
};`,
  "src/lib/ai/prompts.ts": `/**
 * Prompt registry.
 * All prompts are defined here — never inline in components.
 * No legal advice is provided in any prompt at this stage.
 */

export const PROMPTS = {
  /**
   * System readiness check.
   * A minimal safe prompt to verify that Gemini integration is working.
   * Returns a structured JSON response confirming connectivity.
   */
  SYSTEM_READINESS_CHECK: \`
You are a system readiness verification assistant.
Respond with a JSON object confirming you are operational.

Respond with ONLY this JSON structure:
{
  "status": "ok",
  "model": "<your model identifier>",
  "message": "System is ready.",
  "timestamp": "<current ISO 8601 timestamp>"
}

Do not include any other text, explanation, or markdown.
\`.trim(),

  /**
   * Intake understanding — PLACEHOLDER.
   * Not active yet. Will be implemented in the next development stage.
   * Documented here for architecture visibility.
   */
  INTAKE_UNDERSTANDING: \`[PLANNED - NOT YET IMPLEMENTED]\`,
} as const;

export type PromptKey = keyof typeof PROMPTS;`,
  "src/lib/ai/schemas.ts": `/**
 * AI response schemas.
 * Each schema has:
 *   1. A Zod schema for runtime validation on the client
 *   2. A Firebase AI responseSchema for structured output mode
 */

import { z } from 'zod';
import type { Schema } from 'firebase/ai';
import { SchemaType } from 'firebase/ai';

// ─── System Readiness Schema ─────────────────────────────────────────────────

export const SystemReadinessZodSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  model: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

export type SystemReadinessSchema = z.infer<typeof SystemReadinessZodSchema>;

export const SYSTEM_READINESS_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    status: { type: SchemaType.STRING, enum: ['ok', 'degraded'] },
    model: { type: SchemaType.STRING },
    message: { type: SchemaType.STRING },
    timestamp: { type: SchemaType.STRING },
  },
  required: ['status', 'model', 'message', 'timestamp'],
};

// ─── Case Intake Schema (Planned — not active yet) ────────────────────────────

/**
 * CaseIntakeSchema — structured output from the intake AI stage.
 * PLANNED: Will be activated when intake AI module is implemented.
 */
export const CaseIntakeZodSchema = z.object({
  summary: z.string(),
  detectedJurisdiction: z.string().optional(),
  legalDomains: z.array(z.string()),
  keyFacts: z.array(z.string()),
  entities: z.array(z.object({
    name: z.string(),
    role: z.string(),
  })),
  urgencyLevel: z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']),
  clarificationNeeded: z.array(z.string()),
});

export type CaseIntakeResult = z.infer<typeof CaseIntakeZodSchema>;`,
  "src/lib/ai/streamingHelper.ts": `/**
 * Streaming helper for Firebase AI Logic.
 * Wraps generateContentStream with typed callbacks and error handling.
 *
 * IMPORTANT: This helper is ready but not yet wired to any UI.
 * Streaming UI will be implemented in a future stage.
 */

import { getGenerativeModel } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { DEFAULT_MODEL } from './models';
import type { AIStreamChunk } from '@/types/ai';

export type StreamChunkCallback = (chunk: AIStreamChunk) => void;
export type StreamCompleteCallback = (fullText: string) => void;
export type StreamErrorCallback = (error: Error) => void;

export interface StreamOptions {
  onChunk: StreamChunkCallback;
  onComplete?: StreamCompleteCallback;
  onError?: StreamErrorCallback;
  abortSignal?: AbortSignal;
}

/**
 * Streams a text generation response from Gemini.
 * Calls onChunk for each text delta, onComplete when done.
 */
export async function streamGenerateContent(
  prompt: string,
  options: StreamOptions
): Promise<void> {
  const ai = getAIInstance();
  const model = getGenerativeModel(ai, {
    model: DEFAULT_MODEL.model,
    generationConfig: DEFAULT_MODEL.generationConfig,
    safetySettings: DEFAULT_MODEL.safetySettings,
  });

  let fullText = '';

  try {
    const streamResult = await model.generateContentStream(prompt);

    for await (const chunk of streamResult.stream) {
      if (options.abortSignal?.aborted) {
        break;
      }

      const chunkText = chunk.text();
      fullText += chunkText;

      options.onChunk({
        text: chunkText,
        isComplete: false,
      });
    }

    options.onChunk({ text: '', isComplete: true });
    options.onComplete?.(fullText);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options.onChunk({ text: '', isComplete: true, error: err.message });
    options.onError?.(err);
  }
}`,
  "src/lib/ai/structuredOutputHelper.ts": `/**
 * Structured output helper for Firebase AI Logic.
 * Enables typed JSON responses from Gemini using responseSchema.
 */

import { getGenerativeModel } from 'firebase/ai';
import type { Schema } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { STRUCTURED_MODEL } from './models';
import type { AIStructuredResponse } from '@/types/ai';
import type { ZodSchema } from 'zod';

/**
 * Generates a structured JSON response from Gemini.
 * Validates the response against the provided Zod schema.
 *
 * @param prompt - The prompt to send
 * @param firebaseSchema - Firebase AI responseSchema for the model
 * @param zodSchema - Zod schema for client-side validation
 * @returns Validated, typed response
 */
export async function generateStructured<T>(
  prompt: string,
  firebaseSchema: Schema,
  zodSchema: ZodSchema<T>
): Promise<AIStructuredResponse<T>> {
  const ai = getAIInstance();
  const model = getGenerativeModel(ai, {
    model: STRUCTURED_MODEL.model,
    generationConfig: {
      ...STRUCTURED_MODEL.generationConfig,
      responseSchema: firebaseSchema,
    },
    safetySettings: STRUCTURED_MODEL.safetySettings,
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(responseText);
  } catch {
    throw new Error(\`Gemini returned invalid JSON. Raw response: \${responseText.slice(0, 200)}\`);
  }

  const validated = zodSchema.parse(parsedData);

  return {
    data: validated,
    model: STRUCTURED_MODEL.model,
    generatedAt: new Date().toISOString(),
    promptTokens: result.response.usageMetadata?.promptTokenCount,
    candidateTokens: result.response.usageMetadata?.candidatesTokenCount,
  };
}`,
  "src/lib/ai/multimodalHelper.ts": `/**
 * Multimodal helper — prepares content parts for Gemini multimodal requests.
 *
 * CURRENT STATUS: Architecture in place, not wired to any UI yet.
 * Future: Support file uploads (images, PDFs) for evidence analysis.
 */

import type { Part, TextPart, InlineDataPart } from 'firebase/ai';

export interface MultimodalTextPart {
  type: 'text';
  text: string;
}

export interface MultimodalFilePart {
  type: 'file';
  mimeType: string;
  data: string; // base64-encoded
}

export type MultimodalInput = MultimodalTextPart | MultimodalFilePart;

/**
 * Converts application-level multimodal inputs to Firebase AI Part array.
 * Future: will handle larger files via Firebase Storage references.
 */
export function buildMultimodalParts(inputs: MultimodalInput[]): Part[] {
  return inputs.map((input): Part => {
    if (input.type === 'text') {
      const part: TextPart = { text: input.text };
      return part;
    }

    // Inline data — suitable for small files (< 20MB)
    const part: InlineDataPart = {
      inlineData: {
        mimeType: input.mimeType,
        data: input.data,
      },
    };
    return part;
  });
}

/**
 * Validates that a file is within safe size limits for inline data.
 * Future: larger files should use Firebase Storage.
 */
export function validateInlineFileSize(fileSizeBytes: number): void {
  const MAX_INLINE_BYTES = 20 * 1024 * 1024; // 20 MB
  if (fileSizeBytes > MAX_INLINE_BYTES) {
    throw new Error(
      \`File size (\${Math.round(fileSizeBytes / 1024 / 1024)}MB) exceeds the 20MB inline limit. \` +
      \`Upload larger files via Firebase Storage (not yet implemented).\`
    );
  }
}`,
  "src/lib/ai/systemReadiness.ts": `/**
 * System readiness check.
 * Makes a REAL Gemini API call to verify that Firebase AI Logic is connected.
 * Used during development to confirm integration is working.
 * Not used in production user flows.
 */

import { getGenerativeModel } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { READINESS_MODEL } from './models';
import { PROMPTS } from './prompts';
import { SYSTEM_READINESS_FIREBASE_SCHEMA, SystemReadinessZodSchema } from './schemas';
import type { SystemReadinessResponse } from '@/types/ai';

/**
 * Performs a real Gemini API call to verify system readiness.
 * Returns structured confirmation of connectivity.
 *
 * Call this in development to validate:
 * - Firebase app is initialized
 * - App Check token is valid
 * - Gemini Developer API is reachable
 * - Structured output works
 */
export async function checkSystemReadiness(): Promise<SystemReadinessResponse> {
  const ai = getAIInstance();
  const model = getGenerativeModel(ai, {
    model: READINESS_MODEL.model,
    generationConfig: {
      ...READINESS_MODEL.generationConfig,
      responseSchema: SYSTEM_READINESS_FIREBASE_SCHEMA,
    },
    safetySettings: READINESS_MODEL.safetySettings,
  });

  const result = await model.generateContent(PROMPTS.SYSTEM_READINESS_CHECK);
  const responseText = result.response.text();

  const parsed: unknown = JSON.parse(responseText);
  const validated = SystemReadinessZodSchema.parse(parsed);

  return validated;
}`,
  "src/store/useAppStore.ts": `/**
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
}));`,
  "src/store/useCaseStore.ts": `/**
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

  // Actions
  setNarrativeInput: (text: string) => void;
  setCurrentDraft: (draft: CaseDraft | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  clearDraft: () => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  currentDraft: null,
  narrativeInput: '',
  isSubmitting: false,

  setNarrativeInput: (text) => set({ narrativeInput: text }),
  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  clearDraft: () => set({ currentDraft: null, narrativeInput: '' }),
}));`,
  "src/components/ui/Button.tsx": `/**
 * Accessible Button component.
 * Supports variants, sizes, loading state, and keyboard navigation.
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={clsx(
          // Base
          'inline-flex items-center justify-center gap-2',
          'rounded-lg font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'motion-reduce:transition-none',
          // Disabled
          isDisabled && 'cursor-not-allowed opacity-60',
          // Variants
          variant === 'primary' && [
            'bg-brand-500 text-white',
            'hover:bg-brand-600 active:bg-brand-700',
            'focus-visible:ring-brand-500',
          ],
          variant === 'secondary' && [
            'bg-neutral-100 text-neutral-800 border border-neutral-200',
            'hover:bg-neutral-200 active:bg-neutral-300',
            'focus-visible:ring-brand-500',
          ],
          variant === 'ghost' && [
            'bg-transparent text-neutral-700',
            'hover:bg-neutral-100 active:bg-neutral-200',
            'focus-visible:ring-brand-500',
          ],
          variant === 'danger' && [
            'bg-trust-red text-white',
            'hover:opacity-90 active:opacity-80',
            'focus-visible:ring-trust-red',
          ],
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2.5 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingDots />
            <span>{loadingText ?? 'Loading\\u2026'}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function LoadingDots() {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1 w-1 rounded-full bg-current animate-pulse-soft"
          style={{ animationDelay: \`\${i * 0.15}s\` }}
        />
      ))}
    </span>
  );
}`,
  "src/components/ui/Textarea.tsx": `/**
 * Accessible growing Textarea.
 * Auto-resizes as content grows. Includes label, hint, error states.
 */

import { type TextareaHTMLAttributes, forwardRef, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  charCount?: number;
  maxChars?: number;
  hideLabel?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      charCount,
      maxChars,
      hideLabel = false,
      id,
      className,
      onChange,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLTextAreaElement>) ?? internalRef;

    const inputId = id ?? \`textarea-\${label.replace(/\\s+/g, '-').toLowerCase()}\`;
    const hintId = hint ? \`\${inputId}-hint\` : undefined;
    const errorId = error ? \`\${inputId}-error\` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    // Auto-resize
    useEffect(() => {
      const el = ref && 'current' in ref ? ref.current : null;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = \`\${el.scrollHeight}px\`;
    });

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className={clsx(
            'text-sm font-medium text-neutral-700',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>

        {hint && (
          <p id={hintId} className="text-sm text-neutral-500">
            {hint}
          </p>
        )}

        <textarea
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : 'false'}
          rows={4}
          className={clsx(
            'w-full rounded-lg border px-4 py-3',
            'text-neutral-900 placeholder:text-neutral-400',
            'resize-none overflow-hidden',
            'text-base leading-relaxed',
            'transition-colors duration-150 motion-reduce:transition-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            !error && 'border-neutral-300 hover:border-neutral-400',
            error && 'border-trust-red focus:ring-trust-red',
            className
          )}
          onChange={onChange}
          {...props}
        />

        <div className="flex items-center justify-between">
          {error && (
            <p id={errorId} role="alert" className="text-sm text-trust-red">
              {error}
            </p>
          )}
          {charCount !== undefined && maxChars !== undefined && (
            <p
              className={clsx(
                'ml-auto text-xs',
                charCount > maxChars * 0.9 ? 'text-trust-amber' : 'text-neutral-400',
                charCount > maxChars && 'text-trust-red'
              )}
              aria-live="polite"
            >
              {charCount.toLocaleString()} / {maxChars.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';`,
  "src/components/ui/VisuallyHidden.tsx": `/** Screen-reader-only content wrapper */

import type { HTMLAttributes } from 'react';

export function VisuallyHidden({
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: 'rect(0, 0, 0, 0)' }}
      {...props}
    >
      {children}
    </span>
  );
}`,
  "src/components/ui/LoadingSpinner.tsx": `/** Accessible loading spinner. Respects prefers-reduced-motion. */

import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  className,
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={clsx(
        'inline-block rounded-full border-2 border-current border-t-transparent',
        'animate-spin motion-reduce:animate-none',
        size === 'sm' && 'h-4 w-4',
        size === 'md' && 'h-6 w-6',
        size === 'lg' && 'h-8 w-8',
        className
      )}
    />
  );
}`,
  "src/components/intake/AIStateIndicator.tsx": `/**
 * AI State Indicator.
 * Visually reflects the current AI processing state.
 * Maps to REAL backend/AI state changes — no fake timers.
 */

'use client';

import { clsx } from 'clsx';
import { AI_STATE_METADATA } from '@/types/ai';
import type { AIProcessingState } from '@/types/ai';

interface AIStateIndicatorProps {
  state: AIProcessingState;
  className?: string;
}

export function AIStateIndicator({ state, className }: AIStateIndicatorProps) {
  const meta = AI_STATE_METADATA[state];

  if (state === 'IDLE') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={\`AI status: \${meta.label}\`}
      className={clsx(
        'flex items-center gap-3 rounded-lg px-4 py-3',
        'text-sm font-medium',
        'transition-all duration-300 motion-reduce:transition-none',
        !meta.isError && 'bg-brand-50 text-brand-700',
        meta.isError && 'bg-red-50 text-trust-red',
        meta.state === 'READY' && 'bg-green-50 text-trust-green',
        className
      )}
    >
      {/* State dot */}
      <span
        aria-hidden="true"
        className={clsx(
          'flex-shrink-0 h-2 w-2 rounded-full',
          !meta.isTerminal && !meta.isError && 'animate-pulse-soft bg-brand-500',
          meta.state === 'READY' && 'bg-trust-green',
          meta.isError && 'bg-trust-red'
        )}
      />

      <span>{meta.label}</span>
    </div>
  );
}`,
  "src/components/intake/IntakeForm.tsx": `/**
 * Primary intake form — "Tell us what happened"
 *
 * This is the first real user interaction.
 * On submit: updates AI state, prepares for Gemini processing.
 * Does NOT make any AI calls yet — that is the next stage.
 */

'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { AIStateIndicator } from './AIStateIndicator';
import { useAppStore } from '@/store/useAppStore';
import { useCaseStore } from '@/store/useCaseStore';

const MAX_CHARS = 5000;
const MIN_CHARS = 50;

export function IntakeForm() {
  const { aiState, setAIState } = useAppStore();
  const { narrativeInput, setNarrativeInput, isSubmitting, setIsSubmitting } = useCaseStore();
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNarrativeInput(e.target.value);
      if (validationError && e.target.value.length >= MIN_CHARS) {
        setValidationError(undefined);
      }
    },
    [setNarrativeInput, validationError]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (narrativeInput.trim().length < MIN_CHARS) {
        setValidationError(
          \`Please tell us a bit more — at least \${MIN_CHARS} characters helps us understand your situation.\`
        );
        return;
      }

      setValidationError(undefined);
      setIsSubmitting(true);
      setAIState('UNDERSTANDING');

      try {
        // TODO: Connect to AI intake module (Stage 2)
        // For now: state transition demonstrates the architecture
        await new Promise((resolve) => setTimeout(resolve, 100));
        // setAIState('READY'); // Will be set by real AI response
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        useAppStore.getState().setAIError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [narrativeInput, setAIState, setIsSubmitting]
  );

  const charCount = narrativeInput.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      aria-label="Tell us what happened"
      noValidate
    >
      <Textarea
        label="What happened?"
        hint="Describe your situation in your own words. The more detail you share, the better we can help."
        placeholder="For example: My landlord refused to return my deposit after I moved out and won't respond to my messages..."
        value={narrativeInput}
        onChange={handleChange}
        error={validationError}
        charCount={charCount}
        maxChars={MAX_CHARS}
        disabled={isSubmitting || aiState === 'UNDERSTANDING'}
        maxLength={MAX_CHARS + 200} // Soft limit in textarea
        aria-required="true"
      />

      {/* Voice input slot — architecture ready, not yet implemented */}
      <div aria-hidden="true" className="hidden">
        {/* TODO: Voice input hook (useVoiceInput) — Stage 3 */}
      </div>

      {/* Language selector slot — architecture ready, not yet implemented */}
      <div aria-hidden="true" className="hidden">
        {/* TODO: Language selector — Stage 3 */}
      </div>

      <AIStateIndicator state={aiState} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Understanding your situation\\u2026"
        disabled={isOverLimit || aiState === 'UNDERSTANDING'}
        className="w-full sm:w-auto sm:self-end"
      >
        Continue
      </Button>
    </form>
  );
}`,
  "src/components/providers/FirebaseProvider.tsx": `/**
 * Firebase Provider.
 * Initializes App Check once on client mount.
 * Must wrap the entire application.
 */

'use client';

import { useEffect } from 'react';
import { initAppCheck } from '@/lib/firebase/appCheck';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAppCheck();
  }, []);

  return <>{children}</>;
}`,
  "src/components/providers/AuthProvider.tsx": `/**
 * Auth Provider.
 * Subscribes to Firebase auth state and syncs to global store.
 */

'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { useAppStore } from '@/store/useAppStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthLoading } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAuthLoading]);

  return <>{children}</>;
}`,
  "src/components/layout/TopNav.tsx": `/**
 * Minimal top navigation.
 * Shows brand name and auth state indicator.
 * No tabs or complex navigation at this stage.
 */

'use client';

import { BRAND } from '@/tokens/design';
import { useAppStore } from '@/store/useAppStore';

export function TopNav() {
  const { user, authLoading } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <a
          href="/"
          className="text-lg font-semibold text-neutral-900 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          aria-label={\`\${BRAND.name} — Home\`}
        >
          {BRAND.name}
        </a>

        {/* Auth indicator — future: full auth UI */}
        <div aria-label="Account status" className="text-sm text-neutral-500">
          {authLoading ? (
            <span aria-live="polite">Loading\\u2026</span>
          ) : user ? (
            <span>{user.displayName ?? user.email ?? 'Signed in'}</span>
          ) : null}
        </div>
      </nav>
    </header>
  );
}`,
  "src/components/layout/AppShell.tsx": `/**
 * App Shell — full-height flex layout wrapper.
 * Provides consistent page structure.
 */

import { TopNav } from './TopNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNav />
      <main
        id="main-content"
        className="flex-1"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="border-t border-neutral-100 py-6">
        <p className="text-center text-xs text-neutral-400">
          This platform provides AI-assisted legal information, not legal advice. Always consult a qualified legal professional for your specific situation.
        </p>
      </footer>
    </div>
  );
}`,
  "src/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── CSS Custom Properties (design tokens as CSS vars) ─────────── */
:root {
  --color-brand: #4f62f5;
  --color-brand-dark: #3337cf;
  --color-text-primary: #171717;
  --color-text-secondary: #525252;
  --color-surface: #f8f8f8;

  --font-sans: 'Inter', system-ui, sans-serif;

  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Reduced Motion ────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ── Base Typography ───────────────────────────────────────────── */
body {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Focus Styles ──────────────────────────────────────────────── */
:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

/* ── Skip to main content ──────────────────────────────────────── */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 0.5rem 1rem;
  background: var(--color-brand);
  color: white;
  font-weight: 600;
  border-radius: 0 0 0.5rem 0;
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: 0;
}
`,
  "src/app/layout.tsx": `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/providers/FirebaseProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { BRAND } from '@/tokens/design';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: \`%s | \${BRAND.name}\`,
  },
  description: BRAND.shortDescription,
  robots: { index: false, follow: false }, // Private during development
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="antialiased">
        {/* Skip to main content — keyboard accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <FirebaseProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}`,
  "src/app/page.tsx": `import { IntakeForm } from '@/components/intake/IntakeForm';
import { BRAND } from '@/tokens/design';

export default function HomePage() {
  return (
    <section
      className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 animate-fade-in"
      aria-labelledby="hero-heading"
    >
      {/* Hero */}
      <div className="mb-12 space-y-4">
        <h1
          id="hero-heading"
          className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl"
          style={{ lineHeight: '1.15' }}
        >
          Tell us what{' '}
          <span className="text-brand-600">happened.</span>
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
          {BRAND.tagline}
        </p>
      </div>

      {/* Intake form */}
      <IntakeForm />

      {/* Trust statement */}
      <div className="mt-12 flex items-start gap-3 rounded-lg bg-neutral-50 px-4 py-4">
        <span className="mt-0.5 text-trust-green" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
        <p className="text-sm text-neutral-600">
          <strong className="font-semibold text-neutral-800">Your information is private.</strong>{' '}
          What you share is used only to help structure your situation. We never share your details with third parties.
        </p>
      </div>
    </section>
  );
}`,
  "__tests__/firebase.test.ts": `/**
 * Firebase initialization tests.
 * Verifies module loads and basic shape without requiring real credentials.
 */

describe('Firebase config validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123:web:abc';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when required env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    await expect(import('@/lib/firebase/firebase')).rejects.toThrow(
      /Missing required Firebase environment variables/
    );
  });
});`,
  "__tests__/intake.test.tsx": `/**
 * IntakeForm component tests.
 * Verifies rendering, accessibility, and basic interactions.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeForm } from '@/components/intake/IntakeForm';

// Mock Firebase modules (not needed for component tests)
jest.mock('@/lib/firebase/firebase', () => ({
  app: { options: { projectId: 'test' } },
  auth: {},
  db: {},
}));

describe('IntakeForm', () => {
  it('renders the textarea with accessible label', () => {
    render(<IntakeForm />);
    expect(screen.getByRole('textbox', { name: /what happened/i })).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<IntakeForm />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows validation error when text is too short', async () => {
    const user = userEvent.setup();
    render(<IntakeForm />);

    const textarea = screen.getByRole('textbox', { name: /what happened/i });
    await user.type(textarea, 'short');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('textarea has aria-required attribute', () => {
    render(<IntakeForm />);
    const textarea = screen.getByRole('textbox', { name: /what happened/i });
    expect(textarea).toHaveAttribute('aria-required', 'true');
  });
});`,
  "__tests__/ai-schemas.test.ts": `/**
 * AI schema validation tests.
 */

import { SystemReadinessZodSchema, CaseIntakeZodSchema } from '@/lib/ai/schemas';

describe('SystemReadinessZodSchema', () => {
  it('validates a correct readiness response', () => {
    const valid = {
      status: 'ok',
      model: 'gemini-2.0-flash',
      message: 'System is ready.',
      timestamp: new Date().toISOString(),
    };
    expect(() => SystemReadinessZodSchema.parse(valid)).not.toThrow();
  });

  it('rejects an invalid status value', () => {
    const invalid = {
      status: 'broken',
      model: 'gemini',
      message: 'x',
      timestamp: 'now',
    };
    expect(() => SystemReadinessZodSchema.parse(invalid)).toThrow();
  });

  it('rejects a missing required field', () => {
    const incomplete = { status: 'ok', model: 'gemini' };
    expect(() => SystemReadinessZodSchema.parse(incomplete)).toThrow();
  });
});

describe('CaseIntakeZodSchema', () => {
  it('validates a correct intake result', () => {
    const valid = {
      summary: 'Tenant dispute over deposit.',
      legalDomains: ['housing', 'contract'],
      keyFacts: ['Deposit not returned', 'No written response'],
      entities: [{ name: 'Landlord', role: 'RESPONDENT' }],
      urgencyLevel: 'MEDIUM',
      clarificationNeeded: [],
    };
    expect(() => CaseIntakeZodSchema.parse(valid)).not.toThrow();
  });

  it('rejects an invalid urgency level', () => {
    const invalid = {
      summary: 'x',
      legalDomains: [],
      keyFacts: [],
      entities: [],
      urgencyLevel: 'VERY_HIGH',
      clarificationNeeded: [],
    };
    expect(() => CaseIntakeZodSchema.parse(invalid)).toThrow();
  });
});`,
  ".env.local.example": `# Firebase Web App Configuration
# Get these from Firebase Console → Project Settings → Your apps → Web app
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# App Check — Debug Token (local development only)
# Generate in Firebase Console: Build → App Check → your web app → Manage debug tokens
# NEVER commit this to source control
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# App Check — Production (do NOT set for local development)
# NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY=`
};

Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
});
console.log('Done creating 40 files.');
