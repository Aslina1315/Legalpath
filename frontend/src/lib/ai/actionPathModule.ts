/**
 * AI Module 10: Action Path
 *
 * Formulates a grounded, prioritized, realistic step-by-step next-actions roadmap
 * derived strictly from verified legal knowledge, identified gaps, and case facts.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { ActionPathZodSchema, ACTION_PATH_FIREBASE_SCHEMA } from './schemas';
import type {
  ActionPathResult,
  ResponseVerificationResult,
  EvidenceGapResult,
  DomainRoutingResult,
  ContradictionResult,
  ClaimVerification,
  AIStructuredResponse,
} from '@/types/ai';
import type { CaseStructureResult } from './schemas';

export interface ActionPathOptions {
  currentSituation?: string;
  verifiedClaims?: ClaimVerification[];
  evidenceGaps?: EvidenceGapResult | null;
  contradictions?: ContradictionResult | null;
  domain?: string;
  jurisdiction?: string | null;
  caseStructure?: CaseStructureResult;
  domainRouting?: DomainRoutingResult;
  verification?: ResponseVerificationResult;
}

export async function runActionPath(
  caseStructureOrOptions: CaseStructureResult | ActionPathOptions,
  domainRoutingArg?: DomainRoutingResult,
  verificationArg?: ResponseVerificationResult,
  evidenceGapsArg?: EvidenceGapResult | null
): Promise<AIStructuredResponse<ActionPathResult>> {
  let domain: string;
  let subDomain: string | undefined;
  let jurisdiction: string;
  let facts: string[];
  let timeline: unknown[];
  let verifiedSummary: string;
  let verifiedClaims: unknown[];
  let unresolvedGaps: unknown[];

  if ('domain' in caseStructureOrOptions || 'currentSituation' in caseStructureOrOptions || 'caseStructure' in caseStructureOrOptions) {
    const opts = caseStructureOrOptions as ActionPathOptions;
    domain = opts.domain || opts.domainRouting?.domain || 'Legal Matter';
    subDomain = opts.domainRouting?.subDomain;
    jurisdiction = opts.jurisdiction || opts.domainRouting?.jurisdiction || 'Detected Jurisdiction';
    facts = opts.caseStructure?.structuredFacts?.map((f: { text: string }) => f.text) || [];
    timeline = opts.caseStructure?.timeline || [];
    verifiedSummary = opts.currentSituation || opts.verification?.verifiedSummary || '';
    verifiedClaims =
      opts.verifiedClaims ||
      opts.verification?.claims.filter((c) => c.status === 'SUPPORTED' || c.status === 'PARTIALLY_SUPPORTED') ||
      [];
    unresolvedGaps =
      opts.evidenceGaps?.gaps.map((g) => ({
        description: g.description,
        importance: g.importance,
        suggestedClarification: g.suggestedClarification,
      })) || [];
  } else {
    const caseStructure = caseStructureOrOptions as CaseStructureResult;
    const domainRouting = domainRoutingArg!;
    const verification = verificationArg!;
    domain = domainRouting.domain;
    subDomain = domainRouting.subDomain;
    jurisdiction = domainRouting.jurisdiction || 'Detected Jurisdiction';
    facts = caseStructure.structuredFacts.map((f: { text: string }) => f.text);
    timeline = caseStructure.timeline;
    verifiedSummary = verification.verifiedSummary;
    verifiedClaims = verification.claims.filter((c) => c.status === 'SUPPORTED' || c.status === 'PARTIALLY_SUPPORTED');
    unresolvedGaps =
      evidenceGapsArg?.gaps.map((g) => ({
        description: g.description,
        importance: g.importance,
        suggestedClarification: g.suggestedClarification,
      })) || [];
  }

  const planningContext = {
    domain,
    subDomain,
    jurisdiction,
    facts,
    timeline,
    verifiedSummary,
    verifiedClaims,
    unresolvedGaps,
  };

  const prompt = `${PROMPTS.ACTION_PATH}

---
<untrusted_data>
ACTION PLANNING SPECIFICATION:
${JSON.stringify(planningContext, null, 2)}
</untrusted_data>
---`;

  return generateStructured<ActionPathResult>(
    prompt,
    ACTION_PATH_FIREBASE_SCHEMA,
    ActionPathZodSchema
  );
}

export const runActionPathPlan = runActionPath;
