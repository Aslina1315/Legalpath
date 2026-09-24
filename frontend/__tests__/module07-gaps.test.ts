/**
 * Module 07 Tests: Evidence Gap Detector
 */

import { EvidenceGapZodSchema } from '@/lib/ai/schemas';
import { runEvidenceGapDetection } from '@/lib/ai/evidenceGapModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Module 07 — Evidence Gap Detector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validGapsData = {
    overallCompleteness: 0.65,
    summary: 'The narrative establishes tenancy and withholding, but lacks the formal written demand letter and proof of delivery.',
    gaps: [
      {
        id: 'gap-1',
        gapType: 'MISSING_DOCUMENT' as const,
        description: 'Copy of written notice providing landlord with forwarding address.',
        importance: 'HIGH' as const,
        whyItMatters: 'Under Texas Property Code § 92.107, the landlord is not obligated to return the deposit until the tenant provides a written forwarding address.',
        suggestedClarification: 'Did you provide your forwarding address via email, certified letter, or text message, and do you have a copy or delivery confirmation?',
      },
      {
        id: 'gap-2',
        gapType: 'MISSING_DATE' as const,
        description: 'Exact date when keys were surrendered.',
        importance: 'MEDIUM' as const,
        whyItMatters: 'The 30-day statutory window runs from the date of physical surrender.',
        suggestedClarification: 'What specific date were the keys handed over or left in the drop box?',
      },
    ],
  };

  it('validates a structured evidence gap detection payload', () => {
    const parsed = EvidenceGapZodSchema.parse(validGapsData);
    expect(parsed.overallCompleteness).toBe(0.65);
    expect(parsed.gaps).toHaveLength(2);
    expect(parsed.gaps[0].gapType).toBe('MISSING_DOCUMENT');
    expect(parsed.gaps[0].importance).toBe('HIGH');
  });

  it('handles empty gaps when documentation is completely substantiated', () => {
    const completeData = {
      overallCompleteness: 1.0,
      summary: 'All stated facts are fully supported by uploaded documentation.',
      gaps: [],
    };

    const parsed = EvidenceGapZodSchema.parse(completeData);
    expect(parsed.overallCompleteness).toBe(1.0);
    expect(parsed.gaps).toHaveLength(0);
  });

  it('runs runEvidenceGapDetection and parses model output successfully', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(validGapsData),
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runEvidenceGapDetection({
      narrative: 'I asked for my deposit back and they said no.',
      structure: {
        timeline: [],
        entities: [],
        structuredFacts: [{ text: 'Deposit withheld', confidence: 0.9 }],
        evidenceAvailable: [],
        evidenceMissing: [],
      },
      evidence: [],
    });

    expect(result.data.gaps).toHaveLength(2);
    expect(result.data.overallCompleteness).toBe(0.65);
  });
});
