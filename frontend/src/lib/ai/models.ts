/**
 * Model configuration registry.
 * Centralizes Gemini model selection and generation parameters.
 */

import type { GenerationConfig, SafetySetting } from 'firebase/ai';
import { HarmBlockThreshold, HarmCategory } from 'firebase/ai';

export type ModelName = 'gemini-3.8-flash' | 'gemini-3.5-flash-lite';

export interface ModelConfig {
  model: ModelName;
  generationConfig: GenerationConfig;
  safetySettings: SafetySetting[];
}

export const PRIMARY_MODEL_NAME: ModelName = 'gemini-3.8-flash';
export const FALLBACK_MODEL_NAME: ModelName = 'gemini-3.5-flash-lite';

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

const baseGemini3GenerationConfig = {
  maxOutputTokens: 2048,
  responseMimeType: 'application/json',
} satisfies Partial<GenerationConfig>;

/** Default model for most AI tasks */
export const DEFAULT_MODEL: ModelConfig = {
  model: PRIMARY_MODEL_NAME,
  generationConfig: {
    ...baseGemini3GenerationConfig,
    maxOutputTokens: 2048,
  },
  safetySettings: legalSafetySettings,
};

/** Structured output model — JSON mode */
export const STRUCTURED_MODEL: ModelConfig = {
  model: PRIMARY_MODEL_NAME,
  generationConfig: {
    ...baseGemini3GenerationConfig,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  },
  safetySettings: legalSafetySettings,
};

export const FALLBACK_MODEL: ModelConfig = {
  model: FALLBACK_MODEL_NAME,
  generationConfig: {
    ...baseGemini3GenerationConfig,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  },
  safetySettings: legalSafetySettings,
};

/** System readiness check — lightweight */
export const READINESS_MODEL: ModelConfig = {
  model: PRIMARY_MODEL_NAME,
  generationConfig: {
    ...baseGemini3GenerationConfig,
    maxOutputTokens: 256,
    responseMimeType: 'application/json',
  },
  safetySettings: legalSafetySettings,
};
