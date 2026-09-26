/**
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
 * Checks whether an error is a Gemini 429 / RESOURCE_EXHAUSTED / quota limit error.
 */
export function is429Error(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('Quota') ||
    msg.includes('rate limit') ||
    msg.includes('GenerateRequestsPerMinute')
  );
}

/**
 * Extracts retry delay in milliseconds from an error message if present,
 * defaulting to 2500ms and capping at 5000ms.
 */
export function extractRetryDelayMs(error: unknown): number {
  if (!error) return 2500;
  const msg = error instanceof Error ? error.message : String(error);
  const match = msg.match(/retry (?:after|in) ([\d.]+)\s*s/i);
  if (match && match[1]) {
    const sec = parseFloat(match[1]);
    if (!isNaN(sec) && sec > 0) return Math.min(Math.round(sec * 1000), 5000);
  }
  return 2500;
}

/**
 * Executes a Gemini operation with at-most-one 429 retry.
 * The provider may include a retry-after delay, but we never loop forever.
 */
export async function executeWithGemini429Handling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (firstError) {
    if (!is429Error(firstError)) {
      throw firstError;
    }

    const delay = extractRetryDelayMs(firstError);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      return await operation();
    } catch (secondError) {
      if (is429Error(secondError)) {
        throw new Error('AI is temporarily at its request limit. Please retry shortly.');
      }
      throw secondError;
    }
  }
}

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

  const result = await executeWithGemini429Handling(() => model.generateContent(prompt));
  const responseText = result.response.text();

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(responseText);
  } catch {
    throw new Error(`Gemini returned invalid JSON. Raw response: ${responseText.slice(0, 200)}`);
  }

  const validated = zodSchema.parse(parsedData);

  return {
    data: validated,
    model: STRUCTURED_MODEL.model,
    generatedAt: new Date().toISOString(),
    promptTokens: result.response.usageMetadata?.promptTokenCount,
    candidateTokens: result.response.usageMetadata?.candidatesTokenCount,
  };
}

