/**
 * AI Module 12: Before-You-Send Review
 *
 * Runs an independent pre-flight verification pass across draft legal communications
 * before export, download, or transmission.
 *
 * VERIFICATION PILLARS:
 * 1. Factual consistency with case
 * 2. Contradiction audit
 * 3. Unsupported legal claims detection
 * 4. Missing critical information / placeholders
 * 5. Missing attachments or references
 * 6. Jurisdiction consistency
 * 7. Source citation consistency
 * 8. Overly confident or aggressive wording
 *
 * Outputs: READY | NEEDS_REVIEW | BLOCKED
 * (No misleading numeric "accuracy score")
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { BeforeSendReviewZodSchema, BEFORE_SEND_REVIEW_FIREBASE_SCHEMA } from './schemas';
import type {
  BeforeSendReviewResult,
  DocumentDraftResult,
  KnowledgeSource,
  AIStructuredResponse,
} from '@/types/ai';

export interface BeforeSendReviewOptions {
  documentDraft: DocumentDraftResult;
  caseFacts: string[];
  verifiedSources: KnowledgeSource[];
  jurisdiction: string;
  evidenceDescriptions?: string[];
  narrativeContext?: string;
}

export async function runBeforeSendReview(
  options: BeforeSendReviewOptions
): Promise<AIStructuredResponse<BeforeSendReviewResult>> {
  const {
    documentDraft,
    caseFacts,
    verifiedSources,
    jurisdiction,
    evidenceDescriptions = [],
    narrativeContext = '',
  } = options;

  const reviewContext = {
    documentTitle: documentDraft.title,
    documentType: documentDraft.documentType,
    recipientRoleOrTitle: documentDraft.recipientRoleOrTitle,
    draftSections: documentDraft.sections.map((sec) => ({
      heading: sec.heading,
      category: sec.category,
      content: sec.content,
      sourceRef: sec.sourceRef,
    })),
    knownCaseFacts: caseFacts,
    verifiedSources: verifiedSources.map((s) => ({
      title: s.title,
      summary: s.summary,
    })),
    jurisdiction,
    uploadedEvidenceAvailable: evidenceDescriptions,
  };

  const prompt = `${PROMPTS.BEFORE_SEND_REVIEW}

---
<untrusted_data>
PRE-FLIGHT VERIFICATION TARGET:
${JSON.stringify(reviewContext, null, 2)}

ORIGINAL NARRATIVE RECORD:
${narrativeContext.slice(0, 1000)}
</untrusted_data>
---`;

  return generateStructured<BeforeSendReviewResult>(
    prompt,
    BEFORE_SEND_REVIEW_FIREBASE_SCHEMA,
    BeforeSendReviewZodSchema
  );
}
