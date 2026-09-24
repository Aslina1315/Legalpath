/**
 * AI schema validation tests.
 */

// Mock firebase/ai to avoid ESM import issues in Jest
jest.mock('firebase/ai', () => ({
  SchemaType: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    INTEGER: 'INTEGER',
  },
}));

import { SystemReadinessZodSchema, CaseIntakeZodSchema } from '@/lib/ai/schemas';

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
    expect(CASE_INTAKE_FIREBASE_SCHEMA.type).toBe('OBJECT');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.required).toContain('summary');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.required).toContain('urgencyLevel');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.required).toContain('legalDomains');
  });

  it('detectedJurisdiction is nullable (optional)', () => {
    const { CASE_INTAKE_FIREBASE_SCHEMA } = require('@/lib/ai/schemas');
    expect(CASE_INTAKE_FIREBASE_SCHEMA.properties.detectedJurisdiction.nullable).toBe(true);
  });
});

