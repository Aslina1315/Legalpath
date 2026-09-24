/**
 * Module 05 Tests: Live Legal Knowledge Retrieval
 */

import { KnowledgeRetrievalZodSchema } from '@/lib/ai/schemas';
import { runKnowledgeRetrieval } from '@/lib/ai/knowledgeRetrievalModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Module 05 — Live Legal Knowledge Retrieval', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validRetrievalData = {
    status: 'verified_sources_found',
    queryUsed: 'Texas Property Code Section 92.103 security deposit refund 30 days',
    keyFindings: [
      'Landlord must return deposit within 30 days of surrender and providing forwarding address.',
      'Itemized list of deductions required if any amount is withheld.',
    ],
    sources: [
      {
        title: 'Texas Property Code § 92.103 - Obligation to Refund',
        url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm',
        sourceType: 'statute',
        publisher: 'Texas Legislature Online',
        retrievedAt: '2026-09-24T12:00:00Z',
        relevance: 'Defines the statutory 30-day timeline for security deposits in Texas.',
        summary: 'A landlord must refund a security deposit to the tenant on or before the 30th day after the tenant surrenders the premises.',
      },
    ],
    applicableRules: ['Texas Property Code Section 92.103', 'Texas Property Code Section 92.104'],
    limitations: ['Does not apply if tenant fails to give forwarding address in writing'],
  };

  it('validates a structured knowledge retrieval with live sources', () => {
    const parsed = KnowledgeRetrievalZodSchema.parse(validRetrievalData);
    expect(parsed.status).toBe('verified_sources_found');
    expect(parsed.sources).toHaveLength(1);
    expect(parsed.sources[0].url).toContain('statutes.capitol.texas.gov');
    expect(parsed.sources[0].sourceType).toBe('statute');
  });

  it('handles "no_verified_source" status properly without inventing citations', () => {
    const noSourcesData = {
      status: 'no_verified_source',
      queryUsed: 'unverified query in obscure jurisdiction',
      keyFindings: ['No verified statutory sources could be retrieved for this query.'],
      sources: [],
      applicableRules: [],
      limitations: ['Search grounding returned no authoritative legal texts for this specific scenario.'],
    };

    const parsed = KnowledgeRetrievalZodSchema.parse(noSourcesData);
    expect(parsed.status).toBe('no_verified_source');
    expect(parsed.sources).toHaveLength(0);
  });

  it('preserves citations from grounding metadata during model execution', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(validRetrievalData),
        candidates: [
          {
            groundingMetadata: {
              groundingAttributions: [
                {
                  web: {
                    uri: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm',
                    title: 'Texas Property Code § 92.103',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runKnowledgeRetrieval({
      structuredFacts: [{ text: 'Tenant moved out June 30th' }],
      domain: 'Housing & Tenancy',
      subDomain: 'Security Deposits',
      jurisdiction: 'Texas, United States',
    });

    expect(result.data.status).toBe('verified_sources_found');
    expect(result.data.sources[0].url).toBe('https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm');
  });
});
