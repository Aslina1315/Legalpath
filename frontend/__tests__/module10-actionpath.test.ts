/**
 * Module 10 Tests: Action Path Planner
 */

import { ActionPathZodSchema } from '@/lib/ai/schemas';
import { runActionPathPlan } from '@/lib/ai/actionPathModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Module 10 — Action Path Planner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validActionPathData = {
    currentSituation: 'Tenant has vacated premises and 30 days have elapsed without receipt of deposit or itemized deduction statement from landlord.',
    humanHelpRecommended: true,
    humanHelpReasoning: 'If the formal demand letter goes unanswered, small claims court filing or consultation with a tenant advocacy attorney in Travis County is recommended.',
    nextSteps: [
      {
        id: 'step-1',
        title: 'Draft Formal Demand Letter for Security Deposit Return',
        description: 'Send a formal demand letter citing Texas Property Code § 92.103 requesting the full return of the $1,500 deposit within 10 days.',
        whyItMatters: 'Establishes formal notice and provides evidence of landlord bad faith if litigation becomes necessary.',
        priority: 'URGENT' as const,
        status: 'PENDING' as const,
        estimatedTimeframe: '1-2 business days',
      },
      {
        id: 'step-2',
        title: 'Send Letter via Certified Mail with Return Receipt',
        description: 'Mail the demand letter with USPS Certified Mail and keep the tracking receipt number.',
        whyItMatters: 'Conclusive legal proof of delivery required by statutory guidelines.',
        priority: 'HIGH' as const,
        status: 'PENDING' as const,
        estimatedTimeframe: 'Day of drafting',
      },
    ],
    documentsNeeded: [
      {
        documentName: 'Original Signed Lease Agreement',
        purpose: 'Proves tenancy terms and initial deposit amount paid.',
        priority: 'HIGH' as const,
      },
      {
        documentName: 'Move-in & Move-out Photo/Video Documentation',
        purpose: 'Rebuts improper deductions for pre-existing wear or normal condition.',
        priority: 'MEDIUM' as const,
      },
    ],
    questionsToResolve: [
      'Was the forwarding address delivered in writing, and what proof of delivery exists?',
      'Has the landlord communicated any specific justification via text or email?',
    ],
    possibleEscalation: [
      {
        route: 'Justice of the Peace (Small Claims) Court',
        condition: 'Landlord refuses refund or fails to respond within 10 business days after receiving certified demand letter.',
        advisoryNote: 'Texas Justice Courts handle civil claims up to $20,000 without requiring attorney representation.',
      },
    ],
  };

  it('validates a complete, prioritized action path roadmap', () => {
    const parsed = ActionPathZodSchema.parse(validActionPathData);
    expect(parsed.nextSteps).toHaveLength(2);
    expect(parsed.nextSteps[0].priority).toBe('URGENT');
    expect(parsed.documentsNeeded).toHaveLength(2);
    expect(parsed.humanHelpRecommended).toBe(true);
    expect(parsed.possibleEscalation).toHaveLength(1);
  });

  it('handles an incomplete case where many facts remain unresolved', () => {
    const incompletePathData = {
      currentSituation: 'Basic narrative submitted but jurisdiction and lease dates remain unverified.',
      humanHelpRecommended: false,
      nextSteps: [
        {
          id: 'step-prelim-1',
          title: 'Gather Baseline Tenancy Documents',
          description: 'Locate lease agreement and payment records to substantiate claim.',
          whyItMatters: 'No legal action can proceed without baseline documentation.',
          priority: 'HIGH' as const,
          status: 'PENDING' as const,
        },
      ],
      documentsNeeded: [
        {
          documentName: 'Lease Agreement',
          purpose: 'Identify jurisdiction and landlord entity',
          priority: 'HIGH' as const,
        },
      ],
      questionsToResolve: ['What state and city did the rental occur in?'],
      possibleEscalation: [],
    };

    const parsed = ActionPathZodSchema.parse(incompletePathData);
    expect(parsed.nextSteps).toHaveLength(1);
    expect(parsed.possibleEscalation).toHaveLength(0);
    expect(parsed.questionsToResolve).toContain('What state and city did the rental occur in?');
  });

  it('runs runActionPathPlan and parses model output successfully', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(validActionPathData),
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runActionPathPlan({
      currentSituation: 'Tenant moved out and deposit withheld.',
      verifiedClaims: [],
      domain: 'Housing & Tenancy',
      jurisdiction: 'Texas, United States',
    });

    expect(result.data.nextSteps).toHaveLength(2);
    expect(result.data.nextSteps[0].title).toContain('Demand Letter');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
