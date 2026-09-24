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
