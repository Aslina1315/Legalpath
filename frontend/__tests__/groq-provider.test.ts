/**
 * Groq Primary Provider & Demo Mode Tests.
 *
 * Verifies:
 * 1. Groq primary mode routing without calling Gemini
 * 2. Response extraction & normalization
 * 3. Zod validation on canonical schemas
 * 4. Groq rate limit (429) handling and truthful recovery
 * 5. Gemini mode restoration when configured
 */

import { generateStructured, isGroqPrimary } from '@/lib/ai/structuredOutputHelper';
import { CaseUnderstandingZodSchema, CASE_UNDERSTANDING_FIREBASE_SCHEMA } from '@/lib/ai/schemas';
import { runCaseUnderstanding } from '@/lib/ai/caseUnderstandingModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Groq Primary Provider & Demo Mode', () => {
  const originalEnv = process.env.NEXT_PUBLIC_AI_PRIMARY_PROVIDER;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_AI_PRIMARY_PROVIDER = originalEnv;
  });

  it('routes to backend Groq directly in Groq-primary mode without calling Gemini', async () => {
    process.env.NEXT_PUBLIC_AI_PRIMARY_PROVIDER = 'groq';

    const validCaseUnderstandingData = {
      summary: 'Tenant received eviction notice without statutory 30-day notice.',
      structuredFacts: [
        { text: 'Tenant received notice on June 1st', confidence: 0.9 },
        { text: 'No 30-day cure period provided', confidence: 0.85 },
      ],
      entities: [
        { name: 'John Doe', role: 'Tenant' },
        { name: 'Acme Property Mgmt', role: 'Landlord' },
      ],
      timeline: [
        { description: 'Notice delivered', date: '2026-06-01', confidence: 0.9 },
      ],
      domain: 'Housing & Tenancy',
      subDomain: 'Eviction Notice',
      domainConfidence: 0.95,
      jurisdiction: 'Texas, United States',
      jurisdictionConfidence: 0.9,
      missingInformation: ['Copy of written lease agreement'],
      urgencySignals: ['Imminent lockout notice'],
      urgencyLevel: 'HIGH',
      initialEvidenceGaps: ['Notice document', 'Lease copy'],
    };

    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'ok',
        provider: 'groq',
        model: 'qwen/qwen3.8-27b',
        text: JSON.stringify(validCaseUnderstandingData),
      }),
    });
    globalThis.fetch = fetchSpy;

    const result = await runCaseUnderstanding(
      'I was served an eviction notice without 30 days notice in Texas.'
    );

    // Verify backend Groq endpoint was called
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('/api/backend/ai/generate');

    // Verify Gemini was NEVER called
    expect(getGenerativeModel).not.toHaveBeenCalled();

    // Verify result is parsed and validated by Zod
    expect(result.data.domain).toBe('Housing & Tenancy');
    expect(result.data.urgencyLevel).toBe('HIGH');
    expect(result.model).toBe('qwen/qwen3.8-27b');
  });

  it('handles Groq rate limit (429) truthfully without falling back to Gemini in Groq-only mode', async () => {
    process.env.NEXT_PUBLIC_AI_PRIMARY_PROVIDER = 'groq';

    const fetchSpy = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        status: 'error',
        provider: 'groq',
        code: 'GROQ_RATE_LIMITED',
        rate_limited: true,
        message: 'Groq AI rate limit reached. Please wait a moment and retry.',
      }),
    });
    globalThis.fetch = fetchSpy;

    await expect(
      generateStructured(
        'Test prompt',
        CASE_UNDERSTANDING_FIREBASE_SCHEMA,
        CaseUnderstandingZodSchema
      )
    ).rejects.toThrow('request limit');

    // Gemini must still not be called
    expect(getGenerativeModel).not.toHaveBeenCalled();
  });

  it('restores Gemini primary behavior when NEXT_PUBLIC_AI_PRIMARY_PROVIDER is gemini', async () => {
    process.env.NEXT_PUBLIC_AI_PRIMARY_PROVIDER = 'gemini';

    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            summary: 'Gemini generated summary',
            structuredFacts: [{ text: 'Fact 1', confidence: 0.9 }],
            entities: [],
            timeline: [],
            domain: 'Housing & Tenancy',
            domainConfidence: 0.9,
            jurisdiction: 'Texas',
            jurisdictionConfidence: 0.8,
            missingInformation: [],
            urgencySignals: [],
            urgencyLevel: 'LOW',
            initialEvidenceGaps: [],
          }),
        usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 100 },
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await generateStructured(
      'Test prompt',
      CASE_UNDERSTANDING_FIREBASE_SCHEMA,
      CaseUnderstandingZodSchema
    );

    expect(getGenerativeModel).toHaveBeenCalled();
    expect(result.data.summary).toBe('Gemini generated summary');
  });
});
