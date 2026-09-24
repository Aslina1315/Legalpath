/**
 * AI Module 08: Contradiction Detector
 *
 * Compares statements across user narrative, extracted facts, timeline,
 * and uploaded document evidence to identify discrepancies.
 *
 * Never silently resolves conflicting values. Surfaces all conflicts
 * to give the user an opportunity to clarify.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { ContradictionZodSchema, CONTRADICTION_FIREBASE_SCHEMA } from './schemas';
import type { ContradictionResult } from '@/types/ai';
import type { CaseStructureResult } from './schemas';
import type { EvidenceAnalysisResult, AIStructuredResponse } from '@/types/ai';

export interface ContradictionOptions {
  narrative: string;
  structure: CaseStructureResult;
  evidence?: EvidenceAnalysisResult[] | EvidenceAnalysisResult | null;
  userClarifications?: Record<string, string>;
}

export async function runContradictionDetection(
  narrativeOrOptions: string | ContradictionOptions,
  structureArg?: CaseStructureResult,
  evidenceAnalysisArg?: EvidenceAnalysisResult[] | EvidenceAnalysisResult | null,
  userClarificationsArg?: Record<string, string>
): Promise<AIStructuredResponse<ContradictionResult>> {
  let narrative: string;
  let structure: CaseStructureResult;
  let evidence: EvidenceAnalysisResult[] | EvidenceAnalysisResult | null | undefined;
  let userClarifications: Record<string, string> | undefined;

  if (typeof narrativeOrOptions === 'object') {
    narrative = narrativeOrOptions.narrative;
    structure = narrativeOrOptions.structure;
    evidence = narrativeOrOptions.evidence;
    userClarifications = narrativeOrOptions.userClarifications;
  } else {
    narrative = narrativeOrOptions;
    structure = structureArg!;
    evidence = evidenceAnalysisArg;
    userClarifications = userClarificationsArg;
  }

  const comparisonBundle = {
    narrativeStatements: narrative.trim(),
    structuredTimeline: structure.timeline,
    structuredFacts: structure.structuredFacts,
    documentAnalysis: evidence
      ? Array.isArray(evidence)
        ? evidence.map((e) => ({
            documentType: e.documentType,
            extractedDates: e.dates,
            extractedAmounts: e.amounts,
            extractedPeople: e.peopleOrEntities,
            importantStatements: e.importantStatements,
          }))
        : {
            documentType: evidence.documentType,
            extractedDates: evidence.dates,
            extractedAmounts: evidence.amounts,
            extractedPeople: evidence.peopleOrEntities,
            importantStatements: evidence.importantStatements,
          }
      : 'No uploaded document analyzed',
    userClarifications: userClarifications || {},
  };

  const prompt = `${PROMPTS.CONTRADICTION_DETECTION}

---
<untrusted_data>
CASE EVIDENCE & CLAIMS TO COMPARE:
${JSON.stringify(comparisonBundle, null, 2)}
</untrusted_data>
---`;

  return generateStructured<ContradictionResult>(
    prompt,
    CONTRADICTION_FIREBASE_SCHEMA,
    ContradictionZodSchema
  );
}
