/**
 * Pipeline Integration Test
 * Validates the end-to-end continuous AI pipeline with controlled fixtures/mocks.
 */

import { getGenerativeModel } from 'firebase/ai';
import { runIntakeUnderstanding } from '@/lib/ai/intakeModule';
import { runCaseStructuring } from '@/lib/ai/caseStructureModule';
import { runDomainRouting } from '@/lib/ai/domainRoutingModule';
import { runKnowledgeRetrieval } from '@/lib/ai/knowledgeRetrievalModule';
import { runEvidenceGapDetection } from '@/lib/ai/evidenceGapModule';
import { runContradictionDetection } from '@/lib/ai/contradictionModule';
import { runResponseVerification } from '@/lib/ai/responseVerifierModule';
import { runActionPathPlan } from '@/lib/ai/actionPathModule';
import { runDocumentGeneration } from '@/lib/ai/documentGeneratorModule';
import { runBeforeSendReview } from '@/lib/ai/beforeSendReviewModule';
import { resolveHumanHelpResources } from '@/lib/ai/humanHelpModule';

describe('Continuous AI Pipeline Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('executes full continuous case pipeline through all stages without breaking state', async () => {
    // Stage 1: Intake Understanding mock response
    const intakeMock = {
      summary: 'Tenant moved out and landlord withheld security deposit without explanation.',
      keyFacts: ['Deposit was $1500', 'Moved out 30 days ago'],
      legalDomains: ['Housing & Tenancy'],
      entities: [
        { name: 'Tenant', role: 'CLAIMANT' },
        { name: 'Landlord Management', role: 'RESPONDENT' },
      ],
      urgencyLevel: 'MEDIUM' as const,
      urgencyReasoning: 'Statutory 30 days is about to expire.',
      detectedJurisdiction: 'Austin, Texas',
      clarificationNeeded: [],
      confidence: 0.9,
    };

    // Stage 2: Case Structuring mock response
    const structureMock = {
      timeline: [
        { description: 'Signed lease', date: '2023-06-01', confidence: 0.9 },
        { description: 'Moved out', date: '2024-05-31', confidence: 0.95 },
      ],
      entities: [
        { name: 'Tenant', role: 'CLAIMANT' as const },
        { name: 'Landlord Management', role: 'RESPONDENT' as const },
      ],
      structuredFacts: [
        { text: 'Deposit paid was $1500', confidence: 0.95 },
        { text: 'No itemized deduction list provided within 30 days', confidence: 0.9 },
      ],
      evidenceAvailable: ['Lease agreement'],
      evidenceMissing: ['Itemized deductions statement'],
    };

    // Stage 3: Domain Routing mock response
    const domainMock = {
      domain: 'Housing & Tenancy',
      subDomain: 'Security Deposits',
      jurisdiction: 'Texas, United States',
      jurisdictionConfidence: 0.92,
      reasoningSummary: 'Austin, Texas tenancy subject to Texas Property Code Title 8.',
      missingInformation: [],
      urgencySignals: ['Approaching 30-day post-surrender cutoff'],
    };

    // Stage 5: Live Knowledge Retrieval mock response
    const retrievalMock = {
      status: 'verified_sources_found' as const,
      queryUsed: 'Texas Property Code 92.103 security deposit',
      keyFindings: ['Landlord has 30 days to refund or provide itemization.'],
      sources: [
        {
          title: 'Texas Property Code Section 92.103',
          url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm',
          sourceType: 'statute' as const,
          publisher: 'Texas Legislature',
          retrievedAt: '2026-09-24T12:00:00Z',
          relevance: 'Statutory deadline governing security deposits',
          summary: 'Governs deposit refunds in Texas.',
        },
      ],
      applicableRules: ['Tex. Prop. Code § 92.103'],
      limitations: [],
    };

    // Stage 7: Evidence Gaps mock response
    const gapsMock = {
      overallCompleteness: 0.75,
      summary: 'Strong baseline facts, but needs formal delivery confirmation.',
      gaps: [
        {
          id: 'gap-1',
          gapType: 'MISSING_DOCUMENT' as const,
          description: 'Written notice of forwarding address',
          importance: 'HIGH' as const,
          whyItMatters: 'Triggers landlord legal duty to return deposit under Texas law.',
          suggestedClarification: 'Did you provide written forwarding address?',
        },
      ],
    };

    // Stage 8: Contradictions mock response
    const contradictionsMock = {
      hasContradictions: false,
      summary: 'No inconsistencies detected.',
      contradictions: [],
    };

    // Stage 9: Verification mock response
    const verificationMock = {
      overallTrustScore: 0.9,
      verifiedSummary: 'Verified under Texas Property Code § 92.103.',
      disclaimer: 'Informational analysis only.',
      unsupportedClaimsFlagged: [],
      claims: [
        {
          claim: 'Landlord must refund deposit within 30 days.',
          status: 'SUPPORTED' as const,
          supportingSources: ['Texas Property Code Section 92.103'],
          caseFactAlignment: true,
          jurisdictionConsistency: true,
          reasoning: 'Directly supported by retrieved statute.',
        },
      ],
    };

    // Stage 10: Action Path mock response
    const actionPathMock = {
      currentSituation: 'Tenant deposit withheld past statutory deadline.',
      humanHelpRecommended: false,
      nextSteps: [
        {
          id: 'step-1',
          title: 'Send Certified Demand Letter',
          description: 'Cite Texas Property Code § 92.103.',
          whyItMatters: 'Mandatory pre-suit requirement.',
          priority: 'URGENT' as const,
          status: 'PENDING' as const,
          estimatedTimeframe: '24 hours',
        },
      ],
      documentsNeeded: [
        {
          documentName: 'Lease Agreement',
          purpose: 'Establish payment',
          priority: 'HIGH' as const,
        },
      ],
      questionsToResolve: [],
      possibleEscalation: [],
    };

    // Stage 11: Document Generator mock response
    const documentMock = {
      documentId: 'doc-pipeline-1',
      title: 'Demand for Return of Security Deposit',
      documentType: 'demand_letter' as const,
      recipientRoleOrTitle: 'Landlord Management',
      jurisdiction: 'Texas, United States',
      sections: [
        {
          id: 'sec-1',
          heading: 'Factual Background',
          category: 'USER_PROVIDED_FACT' as const,
          content: 'Surrendered unit on May 31, 2024. $1500 deposit withheld.',
          isCustomizable: true,
        },
        {
          id: 'sec-2',
          heading: 'Governing Texas Statute',
          category: 'VERIFIED_SOURCE_INFO' as const,
          content: 'Texas Property Code § 92.103 requires refund within 30 days.',
          sourceRef: 'Texas Property Code Section 92.103',
          isCustomizable: true,
        },
      ],
      userProvidedFactsSummary: ['$1500 deposit withheld'],
      verifiedSourceInformation: [
        {
          citation: 'Tex. Prop. Code § 92.103',
          principle: '30-day refund requirement',
        },
      ],
      aiGeneratedWordingNotice: 'Drafted by AI legal access tool.',
      uncertainOrMissingInformation: [],
      formalNoticeDisclaimer: 'Not formal legal representation.',
      generatedAt: '2026-09-25T10:00:00Z',
    };

    // Stage 12: Before-You-Send Review mock response
    const beforeSendReviewMock = {
      verdict: 'READY' as const,
      summary: 'All claims are consistent with case facts and grounded in Texas statutes.',
      checklist: [
        {
          id: 'chk-1',
          category: 'FACTUAL_CONSISTENCY' as const,
          label: 'Factual Consistency',
          passed: true,
          severity: 'PASS' as const,
          details: 'Facts match narrative and lease.',
        },
        {
          id: 'chk-2',
          category: 'UNSUPPORTED_CLAIMS' as const,
          label: 'Source Grounding',
          passed: true,
          severity: 'PASS' as const,
          details: 'Grounded in Texas Property Code § 92.103.',
        },
      ],
      blockers: [],
      warnings: [],
      confirmationsNeeded: ['Confirm date forwarding address provided.'],
      reviewedAt: '2026-09-25T10:05:00Z',
    };

    // Sequentially mock each Gemini call
    const mockResponses = [
      intakeMock,
      structureMock,
      domainMock,
      retrievalMock,
      gapsMock,
      contradictionsMock,
      verificationMock,
      actionPathMock,
      documentMock,
      beforeSendReviewMock,
    ];

    let callCount = 0;
    (getGenerativeModel as jest.Mock).mockImplementation(() => ({
      generateContent: jest.fn().mockImplementation(async () => {
        const payload = mockResponses[callCount] || actionPathMock;
        callCount++;
        return {
          response: {
            text: () => JSON.stringify(payload),
          },
        };
      }),
    }));

    // Step 1: Intake
    const narrative = 'My landlord in Austin, TX withheld my $1,500 security deposit without any reason.';
    const step1 = await runIntakeUnderstanding(narrative);
    expect(step1.data.summary).toBeTruthy();

    // Step 2: Structure
    const step2 = await runCaseStructuring(narrative, step1.data);
    expect(step2.data.structuredFacts).toHaveLength(2);

    // Step 3: Domain
    const step3 = await runDomainRouting({
      narrative,
      facts: step2.data.structuredFacts.map((f) => f.text),
      locationHint: step1.data.detectedJurisdiction ?? undefined,
    });
    expect(step3.data.domain).toBe('Housing & Tenancy');

    // Step 5: Knowledge Retrieval
    const step5 = await runKnowledgeRetrieval({
      structuredFacts: step2.data.structuredFacts,
      domain: step3.data.domain,
      subDomain: step3.data.subDomain,
      jurisdiction: step3.data.jurisdiction ?? undefined,
    });
    expect(step5.data.sources).toHaveLength(1);

    // Step 7: Gaps
    const step7 = await runEvidenceGapDetection({
      narrative,
      structure: step2.data,
      evidence: [],
      retrievedKnowledge: step5.data,
    });
    expect(step7.data.gaps).toHaveLength(1);

    // Step 8: Contradictions
    const step8 = await runContradictionDetection({
      narrative,
      structure: step2.data,
      evidence: [],
      userClarifications: {},
    });
    expect(step8.data.hasContradictions).toBe(false);

    // Step 9: Verification
    const step9 = await runResponseVerification({
      draftResponse: 'Landlord must refund within 30 days under Texas law.',
      retrievedKnowledge: step5.data,
      structuredFacts: step2.data.structuredFacts,
      jurisdiction: step3.data.jurisdiction ?? undefined,
    });
    expect(step9.data.overallTrustScore).toBe(0.9);

    // Step 10: Action Path
    const step10 = await runActionPathPlan({
      currentSituation: step9.data.verifiedSummary,
      verifiedClaims: step9.data.claims,
      evidenceGaps: step7.data,
      contradictions: step8.data,
      domain: step3.data.domain,
      jurisdiction: step3.data.jurisdiction ?? undefined,
    });
    expect(step10.data.nextSteps).toHaveLength(1);
    expect(step10.data.nextSteps[0].priority).toBe('URGENT');

    // Step 11: Document Generation (Phase 2)
    const step11 = await runDocumentGeneration({
      documentType: 'demand_letter',
      jurisdiction: step3.data.jurisdiction || 'Austin, Texas',
      userProvidedFacts: step2.data.structuredFacts.map((f) => f.text),
      verifiedSources: step5.data.sources,
      actionPath: step10.data,
    });
    expect(step11.data.title).toBe('Demand for Return of Security Deposit');
    expect(step11.data.sections).toHaveLength(2);
    expect(step11.data.sections[0].category).toBe('USER_PROVIDED_FACT');
    expect(step11.data.sections[1].category).toBe('VERIFIED_SOURCE_INFO');

    // Step 12: Before-You-Send Review (Phase 3)
    const step12 = await runBeforeSendReview({
      documentDraft: step11.data,
      caseFacts: step2.data.structuredFacts.map((f) => f.text),
      verifiedSources: step5.data.sources,
      jurisdiction: step3.data.jurisdiction || 'Austin, Texas',
    });
    expect(step12.data.verdict).toBe('READY');
    expect(step12.data.checklist).toHaveLength(2);

    // Step 13: Human Help Bridge (Phase 4)
    const humanHelp = resolveHumanHelpResources({
      jurisdiction: step3.data.jurisdiction ?? undefined,
      domain: step3.data.domain,
    });
    expect(humanHelp.officialResources.length).toBeGreaterThan(0);
    expect(humanHelp.headline).toBe('AI has reached the point where human help may be useful.');

    // Continuous pipeline ran all 10 AI stages seamlessly
    expect(callCount).toBe(10);
  });
});
