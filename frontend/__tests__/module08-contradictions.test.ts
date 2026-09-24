/**
 * Module 08 Tests: Contradiction Detector
 */

import { ContradictionZodSchema } from '@/lib/ai/schemas';
import { runContradictionDetection } from '@/lib/ai/contradictionModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Module 08 — Contradiction Detector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validContradictionData = {
    hasContradictions: true,
    summary: 'Detected a discrepancy between the security deposit amount stated in the narrative and the amount written in the tenancy agreement.',
    contradictions: [
      {
        id: 'contra-1',
        field: 'Security Deposit Amount',
        sourceA: 'User Narrative',
        valueA: '$2,000',
        sourceB: 'Tenancy Agreement (Clause 4)',
        valueB: '$1,500',
        severity: 'HIGH' as const,
        explanation: 'The user stated they paid $2,000 for the deposit, but the signed lease specifies $1,500.',
        clarificationNeeded: 'Did you pay an additional pet deposit or fee of $500, or is the $1,500 in the lease the complete deposit amount?',
      },
      {
        id: 'contra-2',
        field: 'Move-out Date',
        sourceA: 'Timeline Event 2',
        valueA: 'June 30, 2024',
        sourceB: 'Move-out Inspection Report',
        valueB: 'July 2, 2024',
        severity: 'MEDIUM' as const,
        explanation: 'Inspection report lists the surrender date 2 days later than the user timeline.',
        clarificationNeeded: 'Please confirm whether physical surrender was June 30 or July 2.',
      },
    ],
  };

  it('validates a payload with detected contradictions and clarification requests', () => {
    const parsed = ContradictionZodSchema.parse(validContradictionData);
    expect(parsed.hasContradictions).toBe(true);
    expect(parsed.contradictions).toHaveLength(2);
    expect(parsed.contradictions[0].sourceA).toBe('User Narrative');
    expect(parsed.contradictions[0].valueB).toBe('$1,500');
    expect(parsed.contradictions[0].clarificationNeeded).toBeTruthy();
  });

  it('validates a consistent case with no contradictions', () => {
    const consistentData = {
      hasContradictions: false,
      summary: 'All dates, amounts, and statements across evidence and narrative are consistent.',
      contradictions: [],
    };

    const parsed = ContradictionZodSchema.parse(consistentData);
    expect(parsed.hasContradictions).toBe(false);
    expect(parsed.contradictions).toHaveLength(0);
  });

  it('runs runContradictionDetection and processes model responses without choosing sides', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(validContradictionData),
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runContradictionDetection({
      narrative: 'I paid $2000 deposit.',
      structure: {
        timeline: [],
        entities: [],
        structuredFacts: [{ text: 'Deposit paid: $2000', confidence: 0.9 }],
        evidenceAvailable: [],
        evidenceMissing: [],
      },
      evidence: [],
      userClarifications: {},
    });

    expect(result.data.hasContradictions).toBe(true);
    expect(result.data.contradictions[0].field).toBe('Security Deposit Amount');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
