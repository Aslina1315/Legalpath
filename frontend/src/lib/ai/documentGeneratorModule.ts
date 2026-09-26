/**
 * AI Module 11: Formal Document Generator
 *
 * Generates structured drafts of formal legal communications (complaints,
 * pre-action letters, demand notices, information requests) strictly grounded
 * in verified case facts and authoritative sources.
 *
 * TRUST GUARANTEES:
 * 1. Does NOT claim to be legally binding or formal representation.
 * 2. Does NOT invent facts, dates, statutes, case citations, or entities.
 * 3. Clearly separates USER-PROVIDED FACTS, VERIFIED SOURCE INFO,
 *    AI-GENERATED WORDING, and UNCERTAIN / MISSING INFORMATION.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { DocumentDraftZodSchema, DOCUMENT_DRAFT_FIREBASE_SCHEMA } from './schemas';
import type {
  DocumentDraftResult,
  DocumentType,
  KnowledgeSource,
  ActionPathResult,
  AIStructuredResponse,
} from '@/types/ai';

export interface DocumentGeneratorOptions {
  documentType: DocumentType;
  jurisdiction: string;
  userProvidedFacts: string[];
  verifiedSources: KnowledgeSource[];
  actionPath?: ActionPathResult | null;
  unresolvedGaps?: string[];
  recipientRoleOrTitle?: string;
  narrativeContext?: string;
}

export async function runDocumentGeneration(
  options: DocumentGeneratorOptions
): Promise<AIStructuredResponse<DocumentDraftResult>> {
  const {
    documentType,
    jurisdiction,
    userProvidedFacts,
    verifiedSources,
    actionPath,
    unresolvedGaps = [],
    recipientRoleOrTitle = 'Recipient / Responsible Party',
    narrativeContext = '',
  } = options;

  const draftingContext = {
    documentType,
    jurisdiction,
    recipientRoleOrTitle,
    userProvidedFacts,
    verifiedSources: verifiedSources.map((s) => ({
      title: s.title,
      url: s.url,
      summary: s.summary,
      rules: s.relevance,
    })),
    actionPathSteps: actionPath?.nextSteps?.map((st) => st.title) || [],
    unresolvedGaps,
  };

  const prompt = `${PROMPTS.DOCUMENT_GENERATOR}

---
<untrusted_data>
DRAFTING SPECIFICATIONS:
${JSON.stringify(draftingContext, null, 2)}

ORIGINAL NARRATIVE CONTEXT (FOR FACTUAL CITATION ONLY):
${narrativeContext.slice(0, 1500)}
</untrusted_data>
---`;

  return generateStructured<DocumentDraftResult>(
    prompt,
    DOCUMENT_DRAFT_FIREBASE_SCHEMA,
    DocumentDraftZodSchema
  );
}
