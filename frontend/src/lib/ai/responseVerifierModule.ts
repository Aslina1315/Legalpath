/**
 * AI Module 09: AI Response Verifier
 *
 * Core trust safeguard. Deconstructs draft guidance into atomic claims,
 * validates each claim against retrieved authoritative sources and verified case facts,
 * flags unsupported or hallucinated assertions, and emits a verified summary.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { ResponseVerificationZodSchema, RESPONSE_VERIFICATION_FIREBASE_SCHEMA } from './schemas';
import type { ResponseVerificationResult } from '@/types/ai';
import type { KnowledgeRetrievalResult, DomainRoutingResult, AIStructuredResponse } from '@/types/ai';
import type { CaseStructureResult } from './schemas';

export interface ResponseVerificationOptions {
  draftResponse?: string;
  draftGuidance?: string;
  retrievedKnowledge?: KnowledgeRetrievalResult | null;
  structuredFacts?: Array<{ text: string }> | string[];
  caseStructure?: CaseStructureResult;
  domainRouting?: DomainRoutingResult;
  jurisdiction?: string;
  domain?: string;
}

export async function runResponseVerification(
  draftOrOptions: string | ResponseVerificationOptions,
  retrievedKnowledgeArg?: KnowledgeRetrievalResult,
  domainRoutingArg?: DomainRoutingResult,
  caseStructureArg?: CaseStructureResult
): Promise<AIStructuredResponse<ResponseVerificationResult>> {
  let draftGuidance: string;
  let jurisdiction: string;
  let domain: string;
  let sources: Array<{ title: string; url: string; summary: string; rules: string }>;
  let facts: string[];

  if (typeof draftOrOptions === 'object') {
    draftGuidance = draftOrOptions.draftResponse || draftOrOptions.draftGuidance || '';
    jurisdiction = draftOrOptions.jurisdiction || draftOrOptions.domainRouting?.jurisdiction || 'Detected Jurisdiction';
    domain = draftOrOptions.domain || draftOrOptions.domainRouting?.domain || 'Legal Matter';
    sources =
      draftOrOptions.retrievedKnowledge?.sources.map((s) => ({
        title: s.title,
        url: s.url,
        summary: s.summary,
        rules: s.relevance,
      })) || [];
    facts = draftOrOptions.structuredFacts
      ? draftOrOptions.structuredFacts.map((f) => (typeof f === 'string' ? f : f.text))
      : draftOrOptions.caseStructure?.structuredFacts.map((f: { text: string }) => f.text) || [];
  } else {
    draftGuidance = draftOrOptions;
    jurisdiction = domainRoutingArg?.jurisdiction || 'Detected Jurisdiction';
    domain = domainRoutingArg?.domain || 'Legal Matter';
    sources =
      retrievedKnowledgeArg?.sources.map((s) => ({
        title: s.title,
        url: s.url,
        summary: s.summary,
        rules: s.relevance,
      })) || [];
    facts = caseStructureArg?.structuredFacts.map((f: { text: string }) => f.text) || [];
  }

  const verificationContext = {
    draftGuidanceText: draftGuidance.trim(),
    targetedJurisdiction: jurisdiction,
    targetedDomain: domain,
    authoritativeSourcesRetrieved: sources,
    knownCaseFacts: facts,
  };

  const prompt = `${PROMPTS.AI_RESPONSE_VERIFIER}

---
<untrusted_data>
VERIFICATION INPUT BUNDLE:
${JSON.stringify(verificationContext, null, 2)}
</untrusted_data>
---`;

  return generateStructured<ResponseVerificationResult>(
    prompt,
    RESPONSE_VERIFICATION_FIREBASE_SCHEMA,
    ResponseVerificationZodSchema
  );
}
