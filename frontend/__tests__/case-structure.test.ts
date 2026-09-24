/**
 * CaseStructureZodSchema tests — AI Module 02 schema validation.
 */

// Mock firebase/ai
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

import { CaseStructureZodSchema } from '@/lib/ai/schemas';

const VALID_STRUCTURE = {
  timeline: [
    {
      description: 'Tenant moved out on 15 March 2024',
      date: '2024-03-15',
      confidence: 0.95,
    },
    {
      description: 'Landlord failed to return deposit within 30 days',
      approximateDate: 'approximately mid-April 2024',
      confidence: 0.7,
    },
  ],
  entities: [
    { name: 'The Tenant', role: 'CLAIMANT', notes: 'Person submitting the claim' },
    { name: 'The Landlord', role: 'RESPONDENT' },
  ],
  structuredFacts: [
    { text: 'Deposit of £1,200 was paid at the start of the tenancy', confidence: 0.9 },
    { text: 'Landlord has not responded to messages', confidence: 0.85 },
  ],
  evidenceAvailable: ['Text messages to landlord', 'Original tenancy agreement'],
  evidenceMissing: ['Deposit protection certificate', 'Move-out inspection report'],
};

describe('CaseStructureZodSchema', () => {
  it('validates a complete valid structure', () => {
    expect(() => CaseStructureZodSchema.parse(VALID_STRUCTURE)).not.toThrow();
  });

  it('accepts timeline events with only approximateDate (no exact date)', () => {
    const data = {
      ...VALID_STRUCTURE,
      timeline: [{ description: 'Something happened', approximateDate: '3 months ago', confidence: 0.5 }],
    };
    expect(() => CaseStructureZodSchema.parse(data)).not.toThrow();
  });

  it('accepts empty arrays for evidenceAvailable and evidenceMissing', () => {
    const data = { ...VALID_STRUCTURE, evidenceAvailable: [], evidenceMissing: [] };
    expect(() => CaseStructureZodSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid entity role', () => {
    const data = {
      ...VALID_STRUCTURE,
      entities: [{ name: 'Someone', role: 'VILLAIN' }],
    };
    expect(() => CaseStructureZodSchema.parse(data)).toThrow();
  });

  it('rejects confidence values outside 0–1', () => {
    const data = {
      ...VALID_STRUCTURE,
      structuredFacts: [{ text: 'A fact', confidence: 1.5 }],
    };
    expect(() => CaseStructureZodSchema.parse(data)).toThrow();
  });

  it('rejects missing required fields', () => {
    const incomplete = { timeline: [], entities: [] }; // missing structuredFacts etc.
    expect(() => CaseStructureZodSchema.parse(incomplete)).toThrow();
  });
});

describe('CASE_STRUCTURE_FIREBASE_SCHEMA', () => {
  it('has correct type and all required fields', () => {
    const { CASE_STRUCTURE_FIREBASE_SCHEMA } = require('@/lib/ai/schemas');
    expect(CASE_STRUCTURE_FIREBASE_SCHEMA.type).toBe('OBJECT');
    const required = CASE_STRUCTURE_FIREBASE_SCHEMA.required as string[];
    expect(required).toContain('timeline');
    expect(required).toContain('entities');
    expect(required).toContain('structuredFacts');
    expect(required).toContain('evidenceAvailable');
    expect(required).toContain('evidenceMissing');
  });

  it('entity role property has enum values', () => {
    const { CASE_STRUCTURE_FIREBASE_SCHEMA } = require('@/lib/ai/schemas');
    const entityItems = CASE_STRUCTURE_FIREBASE_SCHEMA.properties.entities.items;
    const roleEnum = entityItems.properties.role.enum as string[];
    expect(roleEnum).toContain('CLAIMANT');
    expect(roleEnum).toContain('RESPONDENT');
    expect(roleEnum).toContain('INSTITUTION');
  });
});
