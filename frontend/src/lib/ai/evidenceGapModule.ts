/**
 * AI Module 07: Evidence Gap Detector
 *
 * Cross-references narrative, structured facts, uploaded documents,
 * and retrieved legal rules to identify missing evidentiary proof.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { EvidenceGapZodSchema, EVIDENCE_GAP_FIREBASE_SCHEMA } from './schemas';
import type { EvidenceGapResult } from '@/types/ai';
import type { CaseStructureResult } from './schemas';
import type { EvidenceAnalysisResult, KnowledgeRetrievalResult, AIStructuredResponse } from '@/types/ai';

export interface EvidenceGapOptions {
  narrative: string;
  structure: CaseStructureResult;
  evidence?: EvidenceAnalysisResult[] | EvidenceAnalysisResult | null;
  retrievedKnowledge?: KnowledgeRetrievalResult | null;
}

export async function runEvidenceGapDetection(
  narrativeOrOptions: string | EvidenceGapOptions,
  structureArg?: CaseStructureResult,
  evidenceAnalysisArg?: EvidenceAnalysisResult[] | EvidenceAnalysisResult | null,
  retrievedKnowledgeArg?: KnowledgeRetrievalResult | null
): Promise<AIStructuredResponse<EvidenceGapResult>> {
  let narrative: string;
  let structure: CaseStructureResult;
  let evidence: EvidenceAnalysisResult[] | EvidenceAnalysisResult | null | undefined;
  let retrievedKnowledge: KnowledgeRetrievalResult | null | undefined;

  if (typeof narrativeOrOptions === 'object') {
    narrative = narrativeOrOptions.narrative;
    structure = narrativeOrOptions.structure;
    evidence = narrativeOrOptions.evidence;
    retrievedKnowledge = narrativeOrOptions.retrievedKnowledge;
  } else {
    narrative = narrativeOrOptions;
    structure = structureArg!;
    evidence = evidenceAnalysisArg;
    retrievedKnowledge = retrievedKnowledgeArg;
  }

  const comparisonBundle = {
    narrativeStatements: narrative,
    userClaimsAndFacts: structure.structuredFacts.map((f: { text: string }) => f.text),
    timelineEvents: structure.timeline,
    identifiedEntities: structure.entities,
    userReportedEvidence: structure.evidenceAvailable,
    uploadedDocumentAnalysis: evidence
      ? Array.isArray(evidence)
        ? evidence.map((e) => ({
            type: e.documentType,
            dates: e.dates,
            amounts: e.amounts,
            clauses: e.relevantClauses,
            items: e.evidenceItems,
          }))
        : {
            type: evidence.documentType,
            extractedDates: evidence.dates,
            extractedAmounts: evidence.amounts,
            verifiedClauses: evidence.relevantClauses,
            evidenceItems: evidence.evidenceItems,
          }
      : 'No document uploaded yet',
    statutoryRequirements: retrievedKnowledge
      ? {
          applicableRules: retrievedKnowledge.applicableRules,
          limitations: retrievedKnowledge.limitations,
        }
      : 'No statutory knowledge retrieved yet',
  };

  const prompt = `${PROMPTS.EVIDENCE_GAP_DETECTION}

---
<untrusted_data>
CASE INFORMATION BUNDLE:
${JSON.stringify(comparisonBundle, null, 2)}

ORIGINAL USER NARRATIVE:
${narrative.trim().slice(0, 1500)}
</untrusted_data>
---`;

  return generateStructured<EvidenceGapResult>(
    prompt,
    EVIDENCE_GAP_FIREBASE_SCHEMA,
    EvidenceGapZodSchema
  );
}
