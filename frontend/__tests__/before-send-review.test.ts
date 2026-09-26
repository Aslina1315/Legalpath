/**
 * AI Module 12: Before-You-Send Review Tests
 * Validates independent pre-flight verification pass across draft communications,
 * verifying checklist dimensions, verdict states (READY / NEEDS_REVIEW / BLOCKED),
 * and exclusion of misleading numeric scores.
 */

import { getGenerativeModel } from 'firebase/ai';
import { runBeforeSendReview } from '@/lib/ai/beforeSendReviewModule';
import { BeforeSendReviewZodSchema } from '@/lib/ai/schemas';

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

describe('Module 12: Before-You-Send Review', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockReviewResponse = {
    verdict: 'NEEDS_REVIEW' as const,
    summary: 'The draft is factually aligned with case records, but requires confirmation of the certified mail dispatch date.',
    checklist: [
      {
        id: 'chk-1',
        category: 'FACTUAL_CONSISTENCY' as const,
        label: 'Factual Consistency with Narrative',
        passed: true,
        severity: 'PASS' as const,
        details: 'Deposit sum of $1,500 and move-out date match narrative.',
      },
      {
        id: 'chk-2',
        category: 'CONTRADICTIONS' as const,
        label: 'Conflict & Discrepancy Audit',
        passed: true,
        severity: 'PASS' as const,
        details: 'No internal conflicts between draft assertions and provided lease.',
      },
      {
        id: 'chk-3',
        category: 'UNSUPPORTED_CLAIMS' as const,
        label: 'Legal Claim Grounding',
        passed: true,
        severity: 'PASS' as const,
        details: 'Texas Property Code 92.103 is backed by verified retrieval.',
      },
      {
        id: 'chk-4',
        category: 'MISSING_INFORMATION' as const,
        label: 'Date and Contact Completeness',
        passed: false,
        severity: 'WARNING' as const,
        details: 'Exact date written forwarding address was given is unspecified.',
        remediation: 'Insert exact date of written forwarding address transmission.',
      },
      {
        id: 'chk-5',
        category: 'MISSING_ATTACHMENTS' as const,
        label: 'Referenced Attachments Check',
        passed: false,
        severity: 'WARNING' as const,
        details: 'Draft mentions attached move-out inspection photo, but none uploaded.',
        remediation: 'Attach photos or remove photo reference before sending.',
      },
      {
        id: 'chk-6',
        category: 'JURISDICTION_CONSISTENCY' as const,
        label: 'Jurisdiction & Forum Accuracy',
        passed: true,
        severity: 'PASS' as const,
        details: 'Statutory citations correspond to Texas tenancy rules.',
      },
      {
        id: 'chk-7',
        category: 'SOURCE_CONSISTENCY' as const,
        label: 'Authoritative Source Grounding',
        passed: true,
        severity: 'PASS' as const,
        details: 'Grounded in retrieved official Texas legislative portal.',
      },
      {
        id: 'chk-8',
        category: 'WORDING_CONFIDENCE' as const,
        label: 'Objective Tone & Balanced Assertion',
        passed: true,
        severity: 'PASS' as const,
        details: 'Calm, formal, and objective; avoids defamatory accusations.',
      },
    ],
    blockers: [],
    warnings: [
      'Missing move-out photo attachment.',
      'Unconfirmed date for forwarding address delivery.',
    ],
    confirmationsNeeded: [
      'Confirm you mailed the forwarding address in writing.',
    ],
    reviewedAt: '2026-09-25T10:15:00Z',
  };

  it('validates schema correctly against BeforeSendReviewZodSchema', () => {
    const parsed = BeforeSendReviewZodSchema.parse(mockReviewResponse);
    expect(parsed.verdict).toBe('NEEDS_REVIEW');
    expect(parsed.checklist).toHaveLength(8);
    expect(parsed.warnings).toHaveLength(2);
    expect(parsed.blockers).toHaveLength(0);
  });

  it('runs runBeforeSendReview and returns structured verdict', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockReviewResponse),
        usageMetadata: { promptTokenCount: 350, candidatesTokenCount: 280 },
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runBeforeSendReview({
      documentDraft: {
        documentId: 'doc-1',
        title: 'Pre-Action Notice',
        documentType: 'pre_action_representation',
        recipientRoleOrTitle: 'Landlord',
        jurisdiction: 'Texas',
        sections: [],
        userProvidedFactsSummary: [],
        verifiedSourceInformation: [],
        aiGeneratedWordingNotice: '',
        uncertainOrMissingInformation: [],
        formalNoticeDisclaimer: '',
        generatedAt: '2026-09-25T10:00:00Z',
      },
      caseFacts: ['Deposit was $1,500'],
      verifiedSources: [],
      jurisdiction: 'Texas',
    });

    expect(result.data.verdict).toBe('NEEDS_REVIEW');
    expect(result.data.checklist).toHaveLength(8);
    expect(result.data.warnings).toContain('Missing move-out photo attachment.');
  });

  it('correctly handles BLOCKED verdict state with critical blockers', () => {
    const blockedReview = {
      ...mockReviewResponse,
      verdict: 'BLOCKED' as const,
      blockers: ['Draft asserts fraud that is explicitly contradicted by signed receipt.'],
    };

    const parsed = BeforeSendReviewZodSchema.parse(blockedReview);
    expect(parsed.verdict).toBe('BLOCKED');
    expect(parsed.blockers).toHaveLength(1);
  });
});
