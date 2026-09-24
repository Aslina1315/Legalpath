/**
 * AI Module 03: Legal Domain & Jurisdiction Routing
 *
 * Categorizes the matter into specific domain, sub-domain, and jurisdiction
 * with explicit confidence metrics and missing information questions.
 *
 * Never provides definitive legal advice or outcome predictions.
 */

import { generateStructured } from './structuredOutputHelper';
import { PROMPTS } from './prompts';
import { DomainRoutingZodSchema, DOMAIN_ROUTING_FIREBASE_SCHEMA } from './schemas';
import type { DomainRoutingResult } from '@/types/ai';
import type { CaseIntakeResult, CaseStructureResult } from './schemas';
import type { AIStructuredResponse } from '@/types/ai';

export interface DomainRoutingInputOptions {
  narrative: string;
  facts?: string[];
  locationHint?: string;
}

export async function runDomainRouting(
  narrativeOrOptions: string | DomainRoutingInputOptions,
  intakeSummary?: CaseIntakeResult,
  caseStructure?: CaseStructureResult
): Promise<AIStructuredResponse<DomainRoutingResult>> {
  let narrative: string;
  let structuredContext: Record<string, unknown>;

  if (typeof narrativeOrOptions === 'object') {
    narrative = narrativeOrOptions.narrative;
    structuredContext = {
      intakeSummary: {
        summary: narrative.slice(0, 300),
        detectedJurisdiction: narrativeOrOptions.locationHint || 'Unknown',
        legalDomains: [],
        urgencyLevel: 'MEDIUM',
      },
      keyFacts: narrativeOrOptions.facts || [],
      entities: [],
    };
  } else {
    narrative = narrativeOrOptions;
    structuredContext = {
      intakeSummary: {
        summary: intakeSummary?.summary || narrative.slice(0, 300),
        detectedJurisdiction: intakeSummary?.detectedJurisdiction || 'Unknown',
        legalDomains: intakeSummary?.legalDomains || [],
        urgencyLevel: intakeSummary?.urgencyLevel || 'MEDIUM',
      },
      keyFacts: caseStructure?.structuredFacts?.map((f) => f.text) ?? intakeSummary?.keyFacts ?? [],
      entities: caseStructure?.entities ?? intakeSummary?.entities ?? [],
    };
  }

  if (!narrative || narrative.trim().length < 10) {
    throw new Error('Narrative is required for domain routing.');
  }

  const prompt = `${PROMPTS.DOMAIN_JURISDICTION_ROUTING}

---
<untrusted_data>
CASE SUMMARY & INTENDED DOMAINS:
${JSON.stringify(structuredContext, null, 2)}

ORIGINAL USER NARRATIVE:
${narrative.trim()}
</untrusted_data>
---`;

  return generateStructured<DomainRoutingResult>(
    prompt,
    DOMAIN_ROUTING_FIREBASE_SCHEMA,
    DomainRoutingZodSchema
  );
}
