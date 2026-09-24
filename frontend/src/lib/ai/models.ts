/**
 * Model configuration registry.
 * Centralizes Gemini model selection and generation parameters.
 */

import type { GenerationConfig, SafetySetting } from 'firebase/ai';
import { HarmBlockThreshold, HarmCategory } from 'firebase/ai';

export type ModelName = 'gemini-3.8-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

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
  model: 'gemini-3.8-flash',
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
  model: 'gemini-3.8-flash',
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
  model: 'gemini-3.8-flash',
  generationConfig: {
    temperature: 0.0,
    maxOutputTokens: 256,
    responseMimeType: 'application/json',
  },
  safetySettings: legalSafetySettings,
};
