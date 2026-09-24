/**
 * Module 09 Tests: AI Response Verifier
 */

import { ResponseVerificationZodSchema } from '@/lib/ai/schemas';
import { runResponseVerification } from '@/lib/ai/responseVerifierModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Module 09 — AI Response Verifier', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validVerificationData = {
    overallTrustScore: 0.85,
    verifiedSummary: 'Core statutory timeline and return requirements are supported by Texas Property Code § 92.103. Treble damages claim is conditional on showing bad faith.',
    disclaimer: 'Verification evaluates grounding against retrieved legal sources and case facts. Not legal advice.',
    unsupportedClaimsFlagged: ['Landlord is automatically criminally liable for delayed return.'],
    claims: [
      {
        claim: 'Landlord must refund the security deposit within 30 days of surrender.',
        status: 'SUPPORTED' as const,
        supportingSources: ['Texas Property Code § 92.103'],
        caseFactAlignment: true,
        jurisdictionConsistency: true,
        reasoning: 'Directly supported by Tex. Prop. Code § 92.103 and consistent with tenant surrender date.',
      },
      {
        claim: 'Tenant can automatically sue for triple the deposit amount tomorrow.',
        status: 'UNSUPPORTED' as const,
        supportingSources: [],
        caseFactAlignment: false,
        jurisdictionConsistency: false,
        reasoning: 'Texas law requires proving bad faith and providing formal notice before statutory penalties apply.',
      },
      {
        claim: 'Carpet wear cannot be deducted under ordinary wear and tear.',
        status: 'PARTIALLY_SUPPORTED' as const,
        supportingSources: ['Texas Property Code § 92.104'],
        caseFactAlignment: true,
        jurisdictionConsistency: true,
        reasoning: 'Ordinary wear and tear is exempt, but depends on tenancy duration and prior move-in condition.',
      },
      {
        claim: 'The local municipal tenant board has mandatory mediation jurisdiction.',
        status: 'UNCERTAIN' as const,
        supportingSources: [],
        caseFactAlignment: true,
        jurisdictionConsistency: false,
        reasoning: 'City-specific tenancy board jurisdiction could not be confirmed with available citations.',
      },
    ],
  };

  it('validates a comprehensive response verification audit', () => {
    const parsed = ResponseVerificationZodSchema.parse(validVerificationData);
    expect(parsed.overallTrustScore).toBe(0.85);
    expect(parsed.claims).toHaveLength(4);
    expect(parsed.unsupportedClaimsFlagged).toContain('Landlord is automatically criminally liable for delayed return.');
  });

  it('correctly distinguishes SUPPORTED, UNSUPPORTED, and UNCERTAIN claims', () => {
    const parsed = ResponseVerificationZodSchema.parse(validVerificationData);
    const supported = parsed.claims.filter((c) => c.status === 'SUPPORTED');
    const unsupported = parsed.claims.filter((c) => c.status === 'UNSUPPORTED');
    const uncertain = parsed.claims.filter((c) => c.status === 'UNCERTAIN');

    expect(supported).toHaveLength(1);
    expect(unsupported).toHaveLength(1);
    expect(uncertain).toHaveLength(1);
    expect(unsupported[0].supportingSources).toHaveLength(0);
  });

  it('runs runResponseVerification and filters unverified claims appropriately', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(validVerificationData),
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runResponseVerification({
      draftResponse: 'Landlord must refund within 30 days. You can also sue for triple damages immediately.',
      structuredFacts: [{ text: 'Moved out 30 days ago' }],
      jurisdiction: 'Texas, United States',
    });

    expect(result.data.overallTrustScore).toBe(0.85);
    expect(result.data.claims).toHaveLength(4);
    expect(result.data.unsupportedClaimsFlagged).toHaveLength(1);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
