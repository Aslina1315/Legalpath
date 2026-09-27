/**
 * AI schema validation tests.
 */

// Mock firebase/ai to avoid ESM import issues in Jest
jest.mock('firebase/ai', () => ({
  getGenerativeModel: jest.fn(),
  SchemaType: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    INTEGER: 'INTEGER',
  },
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
    BLOCK_LOW_AND_ABOVE: 'BLOCK_LOW_AND_ABOVE',
    BLOCK_NONE: 'BLOCK_NONE',
  },
}));

import { SystemReadinessZodSchema, CaseIntakeZodSchema, CaseUnderstandingZodSchema } from '@/lib/ai/schemas';
import { generateStructured, normalizeStructuredPayload } from '@/lib/ai/structuredOutputHelper';
import { getGenerativeModel } from 'firebase/ai';

jest.mock('@/lib/ai/aiClient', () => ({
  getAIInstance: jest.fn(() => ({}) ),
}));

describe('SystemReadinessZodSchema', () => {
  it('validates a correct readiness response', () => {
    const valid = {
      status: 'ok',
      model: 'gemini-2.0-flash',
      message: 'System is ready.',
      timestamp: new Date().toISOString(),
    };
    expect(() => SystemReadinessZodSchema.parse(valid)).not.toThrow();
  });

  it('rejects an invalid status value', () => {
    const invalid = {
      status: 'broken',
      model: 'gemini',
      message: 'x',
      timestamp: 'now',
    };
    expect(() => SystemReadinessZodSchema.parse(invalid)).toThrow();
  });

  it('rejects a missing required field', () => {
    const incomplete = { status: 'ok', model: 'gemini' };
    expect(() => SystemReadinessZodSchema.parse(incomplete)).toThrow();
  });
});

describe('CaseIntakeZodSchema', () => {
  it('validates a correct intake result', () => {
    const valid = {
      summary: 'Tenant dispute over deposit.',
      legalDomains: ['housing', 'contract'],
      keyFacts: ['Deposit not returned', 'No written response'],
      entities: [{ name: 'Landlord', role: 'RESPONDENT' }],
      urgencyLevel: 'MEDIUM',
      clarificationNeeded: [],
    };
    expect(() => CaseIntakeZodSchema.parse(valid)).not.toThrow();
  });

  it('accepts optional detectedJurisdiction', () => {
    const valid = {
      summary: 'Discrimination at work.',
      detectedJurisdiction: 'England and Wales',
      legalDomains: ['employment'],
      keyFacts: ['Dismissed without cause'],
      entities: [],
      urgencyLevel: 'HIGH',
      clarificationNeeded: ['When did the dismissal occur?'],
    };
    expect(() => CaseIntakeZodSchema.parse(valid)).not.toThrow();
  });

  it('accepts null detectedJurisdiction when Gemini cannot determine it', () => {
    const validWithNull = {
      summary: 'Contract dispute with vendor.',
      detectedJurisdiction: null,
      legalDomains: ['contract'],
      keyFacts: ['Vendor failed to deliver goods'],
      entities: [],
      urgencyLevel: 'MEDIUM',
      clarificationNeeded: ['Where did the transaction take place?'],
    };
    const parsed = CaseIntakeZodSchema.parse(validWithNull);
    expect(parsed.detectedJurisdiction).toBeNull();
  });

  it('rejects an invalid urgency level', () => {
    const invalid = {
      summary: 'x',
      legalDomains: [],
      keyFacts: [],
      entities: [],
      urgencyLevel: 'VERY_HIGH',
      clarificationNeeded: [],
    };
    expect(() => CaseIntakeZodSchema.parse(invalid)).toThrow();
  });
});

describe('CASE_INTAKE_FIREBASE_SCHEMA', () => {
  it('has the correct type and required fields', () => {
    const { CASE_INTAKE_FIREBASE_SCHEMA } = require('@/lib/ai/schemas');
    expect(String(CASE_INTAKE_FIREBASE_SCHEMA.type)).toBe('OBJECT');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.required).toContain('summary');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.required).toContain('urgencyLevel');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.required).toContain('legalDomains');
  });

  it('detectedJurisdiction is nullable (optional)', () => {
    const { CASE_INTAKE_FIREBASE_SCHEMA } = require('@/lib/ai/schemas');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.properties.detectedJurisdiction.nullable).toBe(true);
  });
});

describe('normalizeStructuredPayload', () => {
  it('normalizes Groq/OpenAI-style wrapper fields into the canonical case-understanding schema', () => {
    const raw = {
      result: {
        overview: 'Tenant did not receive the refund notice within the statutory window.',
        facts: ['deposit was $1,500', 'tenant moved out last month'],
        timeline: [
          { details: 'Lease signed', score: 0.9 },
          { details: 'Deposit not returned', score: 0.8 },
        ],
        domain: 'Housing & Tenancy',
        domain_confidence: 0.91,
        jurisdiction: 'Texas, United States',
        jurisdiction_confidence: 0.88,
        missing_information: ['forwarding address'],
        urgency_signals: ['deadline approaching'],
        urgency_level: 'MEDIUM',
        evidence_gaps: ['proof of payment']
      }
    };

    const normalized = normalizeStructuredPayload(raw);

    expect(normalized.summary).toBe('Tenant did not receive the refund notice within the statutory window.');
    expect((normalized.structuredFacts as Array<{ text: string; confidence: number }>)[0]).toMatchObject({
      text: 'deposit was $1,500',
      confidence: 0.5,
    });
    expect((normalized.timeline as Array<{ description: string; confidence: number }>)[0]).toMatchObject({
      description: 'Lease signed',
      confidence: 0.9,
    });
    expect(normalized.domainConfidence).toBe(0.91);
    expect(normalized.jurisdictionConfidence).toBe(0.88);
    expect(normalized.missingInformation).toEqual(['forwarding address']);
    expect(normalized.urgencySignals).toEqual(['deadline approaching']);
    expect(normalized.urgencyLevel).toBe('MEDIUM');
    expect(normalized.initialEvidenceGaps).toEqual(['proof of payment']);

    expect(() => CaseUnderstandingZodSchema.parse(normalized)).not.toThrow();
  });

  it('normalizes wrapped provider output before zod validation in generateStructured', async () => {
    const model = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            result: {
              overview: 'Housing dispute about late rent notice.',
              facts: ['landlord served a notice', 'tenant disputed the notice date'],
              timeline: [
                { details: 'Notice served', score: 0.9 },
                { details: 'Tenant objected', score: 0.8 },
              ],
              domain: 'Housing & Tenancy',
              domain_confidence: 0.95,
              jurisdiction: 'California, United States',
              jurisdiction_confidence: 0.9,
              missing_information: ['lease clause'],
              urgency_signals: ['deadline approaching'],
              urgency_level: 'HIGH',
              evidence_gaps: ['service proof'],
            },
          }),
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
        },
      }),
    };

    (getGenerativeModel as jest.Mock).mockReturnValue(model);

    const result = await generateStructured(
      'Test prompt',
      { type: 'OBJECT' as any, properties: {}, required: [] } as any,
      CaseUnderstandingZodSchema
    );

    expect(result.data.summary).toBe('Housing dispute about late rent notice.');
    expect(result.data.urgencyLevel).toBe('HIGH');
    expect(result.data.timeline[0]?.description).toBe('Notice served');
    expect(result.data.timeline[0]?.confidence).toBe(0.9);
    expect(result.data.missingInformation).toEqual(['lease clause']);
    expect(result.data.initialEvidenceGaps).toEqual(['service proof']);
  });

  it('falls back to the backend when the primary provider returns malformed structured JSON', async () => {
    const model = {
      generateContent: jest.fn()
        .mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED: rate limit exceeded'))
        .mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              result: {
                overview: 'Malformed provider output',
                facts: ['fact A'],
                timeline: [],
                domain: 'Housing & Tenancy',
                domain_confidence: 0.5,
                jurisdiction: 'Texas, United States',
                jurisdiction_confidence: 0.5,
                missing_information: [],
                urgency_signals: [],
                urgency_level: 'MEDIUM',
                evidence_gaps: [],
              },
            }),
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
          },
        }),
    };

    (getGenerativeModel as jest.Mock).mockReturnValue(model);

    Object.defineProperty(global, 'fetch', {
      value: jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          model: 'qwen/qwen3.8-27b',
          text: JSON.stringify({
            summary: 'Tenant deposit dispute resolved via fallback.',
            structuredFacts: [{ text: 'landlord kept the deposit', confidence: 0.92 }],
            entities: [{ name: 'Landlord', role: 'RESPONDENT' }],
            timeline: [{ description: 'Deposit retained after move-out', date: '2026-01-01', confidence: 0.9 }],
            domain: 'Housing & Tenancy',
            subDomain: 'Security Deposit',
            domainConfidence: 0.93,
            jurisdiction: 'Texas, United States',
            jurisdictionConfidence: 0.88,
            missingInformation: [],
            urgencySignals: ['deadline approaching'],
            urgencyLevel: 'MEDIUM',
            initialEvidenceGaps: [],
          }),
        }),
      }),
      configurable: true,
      writable: true,
    });

    const result = await generateStructured(
      'Test prompt',
      { type: 'OBJECT' as any, properties: {}, required: [] } as any,
      CaseUnderstandingZodSchema
    );

    expect(result.data.summary).toBe('Tenant deposit dispute resolved via fallback.');
    expect(result.data.urgencyLevel).toBe('MEDIUM');
    expect(result.data.timeline[0]?.description).toBe('Deposit retained after move-out');
  });
});

