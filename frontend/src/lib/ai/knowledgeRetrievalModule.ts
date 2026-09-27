/**
 * AI Module 05: Live Legal Knowledge Retrieval
 *
 * Retrieves current, verified legal information using Google Search grounding
 * through Firebase AI Logic.
 *
 * Never fabricates laws or citations. If grounding yields no verified sources,
 * returns status = "no_verified_source".
 */

import { getGenerativeModel } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { FALLBACK_MODEL, FALLBACK_MODEL_NAME, STRUCTURED_MODEL } from './models';
import { PROMPTS } from './prompts';
import { KnowledgeRetrievalZodSchema, KNOWLEDGE_RETRIEVAL_FIREBASE_SCHEMA } from './schemas';
import {
  callSecureBackendFallback,
  canUseSecureBackendFallback,
  executeWithGemini429Handling,
  isTemporaryProviderError,
} from './structuredOutputHelper';
import type { KnowledgeRetrievalResult, KnowledgeSource, DomainRoutingResult } from '@/types/ai';
import type { CaseIntakeResult } from './schemas';
import type { AIStructuredResponse } from '@/types/ai';

export interface KnowledgeRetrievalOptions {
  structuredFacts?: Array<{ text: string }> | string[];
  domain: string;
  subDomain?: string;
  jurisdiction?: string | null;
  narrative?: string;
}

export async function runKnowledgeRetrieval(
  narrativeOrOptions: string | KnowledgeRetrievalOptions,
  domainResult?: DomainRoutingResult,
  intakeSummary?: CaseIntakeResult
): Promise<AIStructuredResponse<KnowledgeRetrievalResult>> {
  let domain: string;
  let subDomain: string | undefined;
  let jurisdiction: string;
  let facts: string[];
  let summaryText: string;

  if (typeof narrativeOrOptions === 'object') {
    domain = narrativeOrOptions.domain;
    subDomain = narrativeOrOptions.subDomain;
    jurisdiction = narrativeOrOptions.jurisdiction || 'Unspecified (General Statutory Guidance)';
    facts = Array.isArray(narrativeOrOptions.structuredFacts)
      ? narrativeOrOptions.structuredFacts.map((f) => (typeof f === 'string' ? f : f.text))
      : [];
    summaryText = narrativeOrOptions.narrative || facts.join('; ');
  } else {
    if (!domainResult?.domain) {
      throw new Error('Legal domain is required for knowledge retrieval.');
    }
    domain = domainResult.domain;
    subDomain = domainResult.subDomain;
    jurisdiction = domainResult.jurisdiction || 'Unspecified (General Statutory Guidance)';
    facts = intakeSummary?.keyFacts || [];
    summaryText = intakeSummary?.summary || narrativeOrOptions;
  }

  if (!domain) {
    throw new Error('Legal domain is required for knowledge retrieval.');
  }

  const researchContext = {
    domain,
    subDomain,
    jurisdiction,
    facts,
    urgencySignals: domainResult?.urgencySignals || [],
  };

  const originalContext =
    typeof narrativeOrOptions === 'object'
      ? narrativeOrOptions.narrative || summaryText
      : narrativeOrOptions;

  const prompt = `${PROMPTS.LIVE_KNOWLEDGE_RETRIEVAL}

---
<untrusted_data>
TARGET MATTER SPECIFICATIONS:
${JSON.stringify(researchContext, null, 2)}

USER SITUATION OVERVIEW:
${summaryText}

ORIGINAL CONTEXT:
${originalContext.trim().slice(0, 1500)}
</untrusted_data>
---`;

  const ai = getAIInstance();

  // Configure model with Google Search grounding tool and structured response schema
  // Grounding uses Google Search tool supported by Gemini Developer API
  const primaryModel = getGenerativeModel(ai, {
    model: STRUCTURED_MODEL.model,
    generationConfig: {
      ...STRUCTURED_MODEL.generationConfig,
      responseSchema: KNOWLEDGE_RETRIEVAL_FIREBASE_SCHEMA,
    },
    safetySettings: STRUCTURED_MODEL.safetySettings,
    tools: [{ googleSearch: {} } as unknown as Record<string, unknown>],
  });

  const fallbackModel = getGenerativeModel(ai, {
    model: FALLBACK_MODEL_NAME,
    generationConfig: {
      ...FALLBACK_MODEL.generationConfig,
      responseSchema: KNOWLEDGE_RETRIEVAL_FIREBASE_SCHEMA,
    },
    safetySettings: FALLBACK_MODEL.safetySettings,
    tools: [{ googleSearch: {} } as unknown as Record<string, unknown>],
  });

  try {
    const result = await executeWithGemini429Handling(
      () => primaryModel.generateContent(prompt),
      undefined
    );
    const responseText = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON returned from Knowledge Retrieval: ${responseText.slice(0, 200)}`);
    }

    // Extract any native grounding metadata from candidate response
    interface CandidateWithGrounding {
      candidates?: Array<{
        groundingMetadata?: {
          groundingAttributions?: Array<{
            web?: { uri?: string; title?: string };
            segment?: { text?: string };
          }>;
        };
      }>;
    }
    const candidate = (result.response as unknown as CandidateWithGrounding)?.candidates?.[0];
    const groundingMeta = candidate?.groundingMetadata;
    const webAttributions: KnowledgeSource[] = [];

    if (groundingMeta?.groundingAttributions && Array.isArray(groundingMeta.groundingAttributions)) {
      const now = new Date().toISOString();
      for (const attr of groundingMeta.groundingAttributions) {
        if (attr.web?.uri && attr.web?.title) {
          webAttributions.push({
            title: attr.web.title,
            url: attr.web.uri,
            sourceType: 'official_portal',
            publisher: 'Google Search Grounding',
            retrievedAt: now,
            relevance: 'Direct statutory/regulatory reference identified via live search grounding',
            summary: attr.segment?.text || attr.web.title,
          });
        }
      }
    }

    const validated = KnowledgeRetrievalZodSchema.parse(parsed);

    // If live search grounding found web attributions not yet in the structured sources, merge them
    if (webAttributions.length > 0) {
      const existingUrls = new Set(validated.sources.map((s) => s.url));
      for (const attr of webAttributions) {
        if (!existingUrls.has(attr.url)) {
          validated.sources.push(attr);
          existingUrls.add(attr.url);
        }
      }
    }

    // If sources list is completely empty, enforce no_verified_source status
    if (validated.sources.length === 0) {
      validated.status = 'no_verified_source';
    }

    return {
      data: validated,
      model: STRUCTURED_MODEL.model,
      generatedAt: new Date().toISOString(),
      promptTokens: result.response.usageMetadata?.promptTokenCount,
      candidateTokens: result.response.usageMetadata?.candidatesTokenCount,
    };
  } catch (error) {
    if (isTemporaryProviderError(error) && canUseSecureBackendFallback('grounded')) {
      try {
        const fallback = await callSecureBackendFallback<{ status: string; text?: string; model?: string }>({
          prompt,
          systemPrompt:
            'You are a careful legal research assistant. Return valid JSON only matching the expected legal knowledge schema.',
          capability: 'grounded',
        });

        if (fallback.status === 'ok' && fallback.text) {
          try {
            const parsed = JSON.parse(fallback.text) as KnowledgeRetrievalResult;
            const normalized = KnowledgeRetrievalZodSchema.parse(parsed);
            return {
              data: normalized,
              model: fallback.model || 'qwen/qwen3.8-27b',
              generatedAt: new Date().toISOString(),
            };
          } catch {
            return {
              data: {
                status: 'no_verified_source',
                queryUsed: 'Live legal source retrieval temporarily unavailable',
                keyFindings: [fallback.text.slice(0, 220)],
                sources: [],
                applicableRules: [],
                limitations: ['Live legal source retrieval was temporarily unavailable; the backend fallback returned non-schema JSON.'],
              },
              model: fallback.model || 'qwen/qwen3.8-27b',
              generatedAt: new Date().toISOString(),
            };
          }
        }
      } catch {
        // Fall through to the normal temporary error response below.
      }
    }

    throw new Error('AI service is temporarily busy. Please try again shortly.');
  }
}

