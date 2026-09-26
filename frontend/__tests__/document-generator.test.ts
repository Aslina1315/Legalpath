/**
 * AI Module 11: Document Generator Tests
 * Validates formal document draft generation, schema compliance,
 * and category separation (USER_PROVIDED_FACT, VERIFIED_SOURCE_INFO, etc.)
 */

import { getGenerativeModel } from 'firebase/ai';
import { runDocumentGeneration } from '@/lib/ai/documentGeneratorModule';
import { DocumentDraftZodSchema } from '@/lib/ai/schemas';

jest.mock('firebase/ai', () => ({
  getAI: jest.fn(() => ({})),
  GoogleAIBackend: jest.fn(),
  getGenerativeModel: jest.fn(),
  HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE' },
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  SchemaType: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    BOOLEAN: 'BOOLEAN',
    NUMBER: 'NUMBER',
    INTEGER: 'INTEGER',
  },
}));

jest.mock('@/lib/firebase/firebase', () => ({
  app: {},
}));

describe('Module 11: Formal Document Generator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockValidDocument = {
    documentId: 'doc-test-101',
    title: 'Pre-Action Representation: Security Deposit Refund Claim',
    documentType: 'pre_action_representation' as const,
    recipientRoleOrTitle: 'Property Management Ltd',
    jurisdiction: 'Texas, United States',
    sections: [
      {
        id: 'sec-1',
        heading: '1. Identification of Parties and Tenancy',
        category: 'USER_PROVIDED_FACT' as const,
        content: 'I surrendered tenancy of Apartment 4B on May 31, 2024, having deposited $1,500.',
        isCustomizable: true,
      },
      {
        id: 'sec-2',
        heading: '2. Statutory Duty to Return Deposit',
        category: 'VERIFIED_SOURCE_INFO' as const,
        content: 'Under Texas Property Code § 92.103, a landlord must refund a security deposit within 30 days after tenant surrenders.',
        sourceRef: 'Texas Property Code Section 92.103',
        isCustomizable: true,
      },
      {
        id: 'sec-3',
        heading: '3. Request for Prompt Resolution',
        category: 'AI_GENERATED_WORDING' as const,
        content: 'I respectfully request that the full amount of $1,500 be disbursed within 14 calendar days of receipt.',
        isCustomizable: true,
      },
      {
        id: 'sec-4',
        heading: '4. Forwarding Address Verification',
        category: 'UNCERTAIN_OR_MISSING' as const,
        content: 'Please verify the date written notice of forwarding address was formally transmitted.',
        isCustomizable: true,
      },
    ],
    userProvidedFactsSummary: [
      'Deposit paid was $1,500.',
      'Tenancy surrendered on May 31, 2024.',
    ],
    verifiedSourceInformation: [
      {
        citation: 'Tex. Prop. Code § 92.103',
        principle: '30-day accounting and refund mandate upon surrender.',
        sourceUrl: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm',
      },
    ],
    aiGeneratedWordingNotice:
      'This draft was formatted by an AI legal access tool and does not constitute formal attorney drafting.',
    uncertainOrMissingInformation: [
      'Proof of certified mail receipt for forwarding address notice.',
    ],
    formalNoticeDisclaimer:
      'Notice: Informational draft only. Not formal legal representation.',
    generatedAt: '2026-09-25T10:00:00Z',
  };

  it('validates schema correctly against DocumentDraftZodSchema', () => {
    const parsed = DocumentDraftZodSchema.parse(mockValidDocument);
    expect(parsed.documentId).toBe('doc-test-101');
    expect(parsed.sections).toHaveLength(4);
    expect(parsed.sections[0].category).toBe('USER_PROVIDED_FACT');
    expect(parsed.sections[1].category).toBe('VERIFIED_SOURCE_INFO');
    expect(parsed.sections[2].category).toBe('AI_GENERATED_WORDING');
    expect(parsed.sections[3].category).toBe('UNCERTAIN_OR_MISSING');
  });

  it('runs runDocumentGeneration with structured response', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockValidDocument),
        usageMetadata: { promptTokenCount: 300, candidatesTokenCount: 250 },
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runDocumentGeneration({
      documentType: 'pre_action_representation',
      jurisdiction: 'Texas, United States',
      userProvidedFacts: ['Deposit was $1,500', 'Moved out May 31'],
      verifiedSources: [
        {
          title: 'Tex. Prop. Code § 92.103',
          url: 'https://statutes.capitol.texas.gov',
          sourceType: 'statute',
          retrievedAt: '2026-09-25T00:00:00Z',
          relevance: 'Deposit refund deadline',
          summary: 'Landlord must refund within 30 days',
        },
      ],
    });

    expect(result.data.title).toBe(mockValidDocument.title);
    expect(result.data.documentType).toBe('pre_action_representation');
    expect(result.data.sections).toHaveLength(4);
    expect(result.data.formalNoticeDisclaimer).toContain('Informational draft only');
  });

  it('throws error when Gemini returns invalid JSON', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => 'Invalid JSON here',
        usageMetadata: {},
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    await expect(
      runDocumentGeneration({
        documentType: 'demand_letter',
        jurisdiction: 'California',
        userProvidedFacts: [],
        verifiedSources: [],
      })
    ).rejects.toThrow();
  });
});
