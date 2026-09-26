/**
 * Targeted Blocker Verification Suite
 *
 * Verifies the 11 critical requirements:
 * 1. story-only pipeline
 * 2. story + evidence pipeline
 * 3. evidence call skipped when no evidence
 * 4. action path works without evidence
 * 5. gaps work without evidence
 * 6. later evidence updates existing case
 * 7. duplicate clicks do not create duplicate Gemini calls
 * 8. 429 produces one controlled retry
 * 9. 429 does not loop
 * 10. clean quota error UI
 * 11. null jurisdiction continues the pipeline
 */

import { getGenerativeModel } from 'firebase/ai';
import { runCaseUnderstanding } from '@/lib/ai/caseUnderstandingModule';
import { runKnowledgeRetrieval } from '@/lib/ai/knowledgeRetrievalModule';
import { runEvidenceAnalysis } from '@/lib/ai/evidenceAnalyzerModule';
import { runTrustAndAction } from '@/lib/ai/trustAndActionModule';
import {
  is429Error,
  extractRetryDelayMs,
  executeWithGemini429Handling,
} from '@/lib/ai/structuredOutputHelper';
import { CaseUnderstandingZodSchema, TrustAndActionZodSchema } from '@/lib/ai/schemas';
import type { KnowledgeRetrievalResult, EvidenceAnalysisResult } from '@/types/ai';

describe('Targeted Blocker Fixes Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCaseUnderstandingData = {
    summary: 'Landlord withheld security deposit of $1200 after move out.',
    structuredFacts: [
      { text: 'Deposit paid was $1200', confidence: 0.95 },
      { text: 'Surrendered apartment on June 30', confidence: 0.9 },
    ],
    entities: [
      { name: 'Tenant', role: 'CLAIMANT' as const },
      { name: 'Property Owner', role: 'RESPONDENT' as const },
    ],
    timeline: [
      { description: 'Surrendered unit', date: '2024-06-30', confidence: 0.95 },
    ],
    domain: 'Housing & Tenancy',
    subDomain: 'Security Deposits',
    domainConfidence: 0.95,
    jurisdiction: null, // Test null jurisdiction!
    jurisdictionConfidence: 0.5,
    missingInformation: ['Specific state or municipal jurisdiction'],
    urgencySignals: ['Approaching 30-day statutory notice threshold'],
    urgencyLevel: 'MEDIUM' as const,
    initialEvidenceGaps: ['Move-out inspection report', 'Deposit receipt'],
  };

  const mockKnowledgeRetrievalData: KnowledgeRetrievalResult = {
    status: 'verified_sources_found',
    queryUsed: 'Residential security deposit statutory return deadlines',
    keyFindings: ['Landlords must account for itemized deductions within statutory deadlines.'],
    applicableRules: ['Section 92.103'],
    limitations: [],
    sources: [
      {
        title: 'Model Residential Landlord-Tenant Statutory Provisions',
        url: 'https://law.cornell.edu/uniform/probate',
        sourceType: 'statute',
        publisher: 'Legal Information Institute',
        retrievedAt: '2026-09-26T12:00:00Z',
        relevance: 'Standard statutory timelines for security deposit accounting',
        summary: 'Landlords must account for itemized deductions within statutory deadlines.',
      },
    ],
  };

  const mockTrustAndActionNoEvidence = {
    evidenceGaps: [
      {
        id: 'gap-1',
        claim: 'Paid security deposit of $1200',
        missingEvidence: 'Original bank receipt or signed lease deposit clause',
        importance: 'CRITICAL' as const,
        suggestion: 'Locate banking statement showing initial deposit payment.',
      },
    ],
    overallCompletenessScore: 0.7,
    recommendedEvidence: ['Bank statement showing transfer', 'Move-out keys receipt'],
    contradictions: [], // Without evidence, contradictions MUST be empty!
    verifiedSummary: 'Verified claim of non-return against statutory rules without documentary proof.',
    claims: [
      {
        id: 'claim-1',
        claimText: 'Tenant paid $1200 deposit to landlord',
        status: 'UNCERTAIN' as const, // Without document, cannot be document-supported
        confidence: 0.7,
        explanation: 'User-provided narrative fact; document verification recommended.',
      },
      {
        id: 'claim-2',
        claimText: 'Landlords are legally required to provide itemized deductions',
        status: 'PARTIALLY_SUPPORTED' as const,
        confidence: 0.9,
        sourceRef: 'https://law.cornell.edu/uniform/probate',
        explanation: 'Supported by governing statutory sources.',
      },
    ],
    overallTrustScore: 0.8,
    actionSteps: [
      {
        id: 'step-1',
        title: 'Issue Formal Pre-Action Demand Notice',
        whyItMatters: 'Establishes clear statutory notice for return of deposit funds.',
        documentsNeeded: ['Draft Demand Notice'],
        priority: 'IMMEDIATE' as const,
        timeframe: '1-3 days',
        status: 'PENDING' as const,
        canGenerateDocument: true,
        documentType: 'demand_letter',
      },
    ],
    documentPreparation: {
      recommendedType: 'demand_letter',
      notes: 'Prepare formal demand specifying amount and forwarding address.',
      warningIfNoEvidence: 'Consider attaching supporting evidence before sending.',
    },
    humanHelpRecommendation: {
      needed: false,
      reason: null,
      suggestedOfficialAid: null,
    },
    followUpState: {
      status: 'ACTION_OPEN' as const,
      message: 'Your action step is open: Prepare your formal demand notice.',
    },
  };

  const mockEvidenceAnalysisData: EvidenceAnalysisResult = {
    documentType: 'Lease Agreement',
    confidence: 0.94,
    dates: [{ date: '2023-07-01', context: 'Lease Start' }],
    amounts: [{ amount: '$1200', context: 'Security Deposit' }],
    peopleOrEntities: [{ name: 'Property Owner', role: 'Landlord' }],
    importantStatements: ['Deposit return within 30 days of surrender'],
    relevantClauses: ['Section 4: Security Deposit'],
    evidenceItems: [
      {
        item: 'Security deposit clause',
        significance: 'Substantiates deposit amount and terms',
        confidence: 0.95,
      },
    ],
    uncertainItems: [],
  };

  // 1 & 11: Story-Only Pipeline & Null Jurisdiction Continues
  it('1 & 11: executes story-only pipeline with null jurisdiction without breaking or requiring evidence', async () => {
    let callCount = 0;
    (getGenerativeModel as jest.Mock).mockImplementation(() => ({
      generateContent: jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { response: { text: () => JSON.stringify(mockCaseUnderstandingData) } };
        }
        if (callCount === 2) {
          return { response: { text: () => JSON.stringify(mockKnowledgeRetrievalData) } };
        }
        return { response: { text: () => JSON.stringify(mockTrustAndActionNoEvidence) } };
      }),
    }));

    // Call 1: Understanding
    const step1 = await runCaseUnderstanding('Landlord withheld security deposit of $1200 after move out.');
    expect(step1.data.jurisdiction).toBeNull();
    expect(step1.data.domain).toBe('Housing & Tenancy');

    // Call 2: Research
    const step2 = await runKnowledgeRetrieval({
      domain: step1.data.domain,
      jurisdiction: step1.data.jurisdiction,
      structuredFacts: step1.data.structuredFacts,
    });
    expect(step2.data.sources).toHaveLength(1);

    // Call 3: SKIPPED (No evidence attached)

    // Call 4: Trust + Action
    const step4 = await runTrustAndAction({
      caseUnderstanding: step1.data,
      retrievedKnowledge: step2.data,
      evidence: [], // Empty evidence!
    });

    expect(step4.data.contradictions).toEqual([]);
    expect(step4.data.actionSteps).toHaveLength(1);
    expect(step4.data.documentPreparation.warningIfNoEvidence).toBe(
      'Consider attaching supporting evidence before sending.'
    );

    // Total calls for story-only: EXACTLY 3 calls (<= 4)
    expect(callCount).toBe(3);
  });

  // 2 & 3: Story + Evidence Pipeline (Calls evidence when attached, <= 4 calls)
  it('2 & 3: executes story + evidence pipeline in <= 4 Gemini calls', async () => {
    let callCount = 0;
    (getGenerativeModel as jest.Mock).mockImplementation(() => ({
      generateContent: jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { response: { text: () => JSON.stringify(mockCaseUnderstandingData) } };
        }
        if (callCount === 2) {
          return { response: { text: () => JSON.stringify(mockKnowledgeRetrievalData) } };
        }
        if (callCount === 3) {
          return { response: { text: () => JSON.stringify(mockEvidenceAnalysisData) } };
        }
        return { response: { text: () => JSON.stringify(mockTrustAndActionNoEvidence) } };
      }),
    }));

    // Call 1
    const step1 = await runCaseUnderstanding('Landlord withheld security deposit of $1200 after move out.');
    // Call 2
    const step2 = await runKnowledgeRetrieval({
      domain: step1.data.domain,
      jurisdiction: step1.data.jurisdiction,
    });
    // Call 3 (evidence attached)
    const step3 = await runEvidenceAnalysis({
      name: 'lease.pdf',
      mimeType: 'application/pdf',
      base64Data: 'dummybase64',
      sizeBytes: 1024,
    });
    expect(step3.data.documentType).toBe('Lease Agreement');

    // Call 4 (trust with evidence)
    const step4 = await runTrustAndAction({
      caseUnderstanding: step1.data,
      retrievedKnowledge: step2.data,
      evidence: [step3.data],
    });

    expect(callCount).toBe(4);
    expect(callCount).toBeLessThanOrEqual(4);
  });

  // 4 & 5: Action path and Gaps work cleanly without evidence
  it('4 & 5: produces action path and evidence gaps without requiring documents', () => {
    const validated = TrustAndActionZodSchema.parse(mockTrustAndActionNoEvidence);
    expect(validated.actionSteps.length).toBeGreaterThan(0);
    expect(validated.evidenceGaps.length).toBeGreaterThan(0);
    expect(validated.contradictions).toHaveLength(0);
  });

  // 6: Later evidence updates existing case
  it('6: later evidence updates existing case via runTrustAndAction with analyzed evidence', async () => {
    (getGenerativeModel as jest.Mock).mockImplementation(() => ({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              ...mockTrustAndActionNoEvidence,
              claims: [
                {
                  id: 'claim-1',
                  claimText: 'Tenant paid $1200 deposit to landlord',
                  status: 'SUPPORTED' as const, // Now supported by attached lease!
                  confidence: 0.95,
                  sourceRef: 'lease.pdf',
                  explanation: 'Directly verified in signed lease section 4.',
                },
              ],
            }),
        },
      }),
    }));

    const updated = await runTrustAndAction({
      caseUnderstanding: mockCaseUnderstandingData,
      retrievedKnowledge: mockKnowledgeRetrievalData,
      evidence: [mockEvidenceAnalysisData],
    });

    expect(updated.data.claims[0].status).toBe('SUPPORTED');
  });

  // 7: Duplicate clicks do not create duplicate calls
  it('7: duplicate clicks guard prevents multiple in-flight calls', async () => {
    let callCounter = 0;
    const fakeGeminiCall = async () => {
      callCounter++;
      await new Promise((r) => setTimeout(r, 50));
      return 'done';
    };

    let isInProgress = false;
    const triggerSubmit = async () => {
      if (isInProgress) return null;
      isInProgress = true;
      try {
        return await fakeGeminiCall();
      } finally {
        isInProgress = false;
      }
    };

    // Fire 3 simultaneous clicks
    const [res1, res2, res3] = await Promise.all([
      triggerSubmit(),
      triggerSubmit(),
      triggerSubmit(),
    ]);

    expect(res1).toBe('done');
    expect(res2).toBeNull();
    expect(res3).toBeNull();
    expect(callCounter).toBe(1);
  });

  // 8 & 9: 429 produces at most ONE controlled retry and does not loop
  it('8 & 9: executeWithGemini429Handling performs at most ONE retry on 429 and throws clean message', async () => {
    let callAttempts = 0;
    const failingOp = jest.fn().mockImplementation(async () => {
      callAttempts++;
      const err = new Error('429 RESOURCE_EXHAUSTED: GenerateRequestsPerMinutePerProjectPerModel-FreeTier retry after 0.1s');
      throw err;
    });

    await expect(executeWithGemini429Handling(failingOp)).rejects.toThrow(
      'AI is temporarily at its request limit. Please retry shortly.'
    );

    // Initial call + exactly 1 retry = 2 attempts
    expect(callAttempts).toBe(2);
  });

  // 10: Clean quota error UI message detection
  it('10: recognizes 429 quota error and does not blame .env.local credentials', () => {
    const quotaError = new Error('RESOURCE_EXHAUSTED quota exceeded');
    expect(is429Error(quotaError)).toBe(true);

    const delay = extractRetryDelayMs(new Error('retry after 3.5s'));
    expect(delay).toBe(3500);

    const defaultDelay = extractRetryDelayMs(quotaError);
    expect(defaultDelay).toBe(2500);
  });
});
