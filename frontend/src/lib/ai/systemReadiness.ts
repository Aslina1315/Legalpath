/**
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
}
