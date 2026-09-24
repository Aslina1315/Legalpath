/**
 * AI Module 01: Intake Understanding
 *
 * Takes the user's raw narrative and calls Gemini (via Firebase AI Logic)
 * to produce a structured CaseIntakeResult.
 *
 * This is the FIRST real AI call in the pipeline.
 * It must:
 *   - Be fast (gemini-3.8-flash, structured output)
 *   - Never invent facts not in the narrative
 *   - Flag urgency correctly
 *   - Be safe enough for vulnerable users
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { CaseIntakeZodSchema, CASE_INTAKE_FIREBASE_SCHEMA } from './schemas';
import type { CaseIntakeResult } from './schemas';
import type { AIStructuredResponse } from '@/types/ai';

/**
 * Runs the intake understanding module.
 *
 * @param narrative  The user's raw free-text narrative (50–5000 chars).
 * @returns          Validated structured intake result + AI metadata.
 */
export async function runIntakeUnderstanding(
  narrative: string
): Promise<AIStructuredResponse<CaseIntakeResult>> {
  if (!narrative || narrative.trim().length < 10) {
    throw new Error('Narrative is too short to process.');
  }

  // Compose the prompt: system instructions + user narrative
  const prompt = `${PROMPTS.INTAKE_UNDERSTANDING}

---
USER NARRATIVE:
${narrative.trim()}
---`;

  return generateStructured<CaseIntakeResult>(
    prompt,
    CASE_INTAKE_FIREBASE_SCHEMA,
    CaseIntakeZodSchema
  );
}
