/**
 * System readiness check.
 * Validates AI provider readiness based on configured provider (Groq or Gemini).
 * Not used in production user flows.
 */

import { getGenerativeModel } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { READINESS_MODEL } from './models';
import { PROMPTS } from './prompts';
import { SYSTEM_READINESS_FIREBASE_SCHEMA, SystemReadinessZodSchema } from './schemas';
import { isGroqPrimary, fetchBackendAIConfig } from './structuredOutputHelper';
import type { SystemReadinessResponse } from '@/types/ai';

/**
 * Performs a provider-aware readiness check.
 */
export async function checkSystemReadiness(): Promise<SystemReadinessResponse> {
  if (isGroqPrimary()) {
    const config = await fetchBackendAIConfig();
    return {
      status: 'ok',
      model: config?.model || 'qwen/qwen3.8-27b',
      message: 'Groq primary backend provider is configured and ready.',
      timestamp: new Date().toISOString(),
    };
  }

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
