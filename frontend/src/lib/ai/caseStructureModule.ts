/**
 * AI Module 02: Case Structuring
 *
 * Runs after Module 01 (Intake Understanding).
 * Input: narrative + CaseIntakeResult summary
 * Output: CaseStructureResult — timeline, entities, structured facts, evidence gaps
 *
 * Uses structured output mode (gemini-3.8-flash) for reliable JSON.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { CaseStructureZodSchema, CASE_STRUCTURE_FIREBASE_SCHEMA } from './schemas';
import type { CaseStructureResult } from './schemas';
import type { CaseIntakeResult } from './schemas';
import type { AIStructuredResponse } from '@/types/ai';

/**
 * Runs the case structuring module (Module 02).
 *
 * @param narrative     The user's original raw narrative.
 * @param intakeSummary The structured result from Module 01.
 * @returns             Validated timeline, entities, structured facts, evidence list.
 */
export async function runCaseStructuring(
  narrative: string,
  intakeSummary: CaseIntakeResult
): Promise<AIStructuredResponse<CaseStructureResult>> {
  const intakeContext = JSON.stringify({
    summary: intakeSummary.summary,
    legalDomains: intakeSummary.legalDomains,
    urgencyLevel: intakeSummary.urgencyLevel,
    detectedJurisdiction: intakeSummary.detectedJurisdiction,
  }, null, 2);

  const prompt = `${PROMPTS.CASE_STRUCTURING}

---
INTAKE SUMMARY (from Module 01):
${intakeContext}

ORIGINAL NARRATIVE:
${narrative.trim()}
---`;

  return generateStructured<CaseStructureResult>(
    prompt,
    CASE_STRUCTURE_FIREBASE_SCHEMA,
    CaseStructureZodSchema
  );
}
