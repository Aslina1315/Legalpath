/**
 * Combined Pipeline Call 1: Case Understanding Module
 *
 * Consolidates Intake Understanding, Case Structuring, and Domain/Jurisdiction Routing
 * into a single structured Gemini call (<= 4 call architecture).
 *
 * If jurisdiction cannot be determined: returns null (does not invent it).
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import {
  CaseUnderstandingZodSchema,
  CASE_UNDERSTANDING_FIREBASE_SCHEMA,
  type CaseUnderstandingResult,
} from './schemas';
import type { AIStructuredResponse } from '@/types/ai';

export async function runCaseUnderstanding(
  narrative: string
): Promise<AIStructuredResponse<CaseUnderstandingResult>> {
  if (!narrative || narrative.trim().length < 10) {
    throw new Error('Narrative is too short to process.');
  }

  const prompt = `${PROMPTS.CASE_UNDERSTANDING}

---
<untrusted_data>
USER NARRATIVE:
${narrative.trim()}
</untrusted_data>
---`;

  return generateStructured<CaseUnderstandingResult>(
    prompt,
    CASE_UNDERSTANDING_FIREBASE_SCHEMA,
    CaseUnderstandingZodSchema
  );
}
