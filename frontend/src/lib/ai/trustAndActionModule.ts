/**
 * Combined Pipeline Call 4: Trust & Action Synthesis Module
 *
 * Consolidates Evidence Gaps, Contradictions, Response Verification,
 * Prioritized Action Path, Document Preparation guidance, Human Help bridge,
 * and Follow-up State into a single structured Gemini call (<= 4 call architecture).
 *
 * Strict Trust Rules Without Evidence:
 * - If no documents provided, contradictions MUST be empty ([]).
 * - Claims are marked as PARTIALLY_SUPPORTED (statutory) or UNCERTAIN.
 * - Missing documents are flagged as evidenceNeeded gaps.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import {
  TrustAndActionZodSchema,
  TRUST_AND_ACTION_FIREBASE_SCHEMA,
  type TrustAndActionResult,
  type CaseUnderstandingResult,
} from './schemas';
import type {
  KnowledgeRetrievalResult,
  EvidenceAnalysisResult,
  AIStructuredResponse,
} from '@/types/ai';

export interface TrustAndActionOptions {
  caseUnderstanding: CaseUnderstandingResult;
  retrievedKnowledge: KnowledgeRetrievalResult;
  evidence?: EvidenceAnalysisResult[];
  userClarifications?: Record<string, string>;
}

export async function runTrustAndAction(
  options: TrustAndActionOptions
): Promise<AIStructuredResponse<TrustAndActionResult>> {
  const { caseUnderstanding, retrievedKnowledge, evidence = [], userClarifications = {} } = options;

  const hasEvidence = evidence.length > 0;

  const promptContext = {
    domain: caseUnderstanding.domain,
    jurisdiction: caseUnderstanding.jurisdiction || 'Unspecified / Needs clarification',
    facts: caseUnderstanding.structuredFacts.map((f) => f.text),
    entities: caseUnderstanding.entities,
    timeline: caseUnderstanding.timeline,
    urgencySignals: caseUnderstanding.urgencySignals,
    retrievedKnowledge: {
      keyFindings: retrievedKnowledge.keyFindings,
      status: retrievedKnowledge.status,
      sources: retrievedKnowledge.sources.map((s) => ({
        title: s.title,
        url: s.url,
        summary: s.summary,
        publisher: s.publisher,
      })),
    },
    evidenceProvided: hasEvidence,
    analyzedEvidence: hasEvidence
      ? evidence.map((e) => ({
          documentType: e.documentType,
          peopleOrEntities: e.peopleOrEntities,
          dates: e.dates,
          amounts: e.amounts,
          importantStatements: e.importantStatements,
          relevantClauses: e.relevantClauses,
          confidence: e.confidence,
        }))
      : 'No documents provided by user yet. Evidence is optional.',
    userClarifications,
  };

  const prompt = `${PROMPTS.TRUST_AND_ACTION}

---
<untrusted_data>
CASE INTELLIGENCE SPECIFICATION:
${JSON.stringify(promptContext, null, 2)}
</untrusted_data>
---`;

  return generateStructured<TrustAndActionResult>(
    prompt,
    TRUST_AND_ACTION_FIREBASE_SCHEMA,
    TrustAndActionZodSchema
  );
}
