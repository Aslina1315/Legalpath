/**
 * Module 03 Tests: Domain & Jurisdiction Routing
 */

import { DomainRoutingZodSchema } from '@/lib/ai/schemas';
import { runDomainRouting } from '@/lib/ai/domainRoutingModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Module 03 — Domain & Jurisdiction Routing', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validDomainData = {
    domain: 'Housing & Tenancy',
    subDomain: 'Security Deposit Recovery',
    jurisdiction: 'Texas, United States',
    jurisdictionConfidence: 0.9,
    reasoningSummary: 'The tenancy took place in Austin, TX with property management based in Travis County.',
    missingInformation: ['Move-out inspection report', 'Original lease agreement start date'],
    urgencySignals: ['Statutory 30-day accounting window has elapsed'],
  };

  it('validates a correct domain and jurisdiction routing payload', () => {
    const parsed = DomainRoutingZodSchema.parse(validDomainData);
    expect(parsed.domain).toBe('Housing & Tenancy');
    expect(parsed.jurisdiction).toBe('Texas, United States');
    expect(parsed.jurisdictionConfidence).toBe(0.9);
  });

  it('handles missing or uncertain jurisdiction with low confidence and missing information', () => {
    const uncertainData = {
      domain: 'Employment Law',
      subDomain: 'Unpaid Wages',
      jurisdiction: 'Unknown / Undetermined',
      jurisdictionConfidence: 0.2,
      reasoningSummary: 'No state or geographic indicators were provided in the narrative.',
      missingInformation: ['State of employment', 'Location of employer headquarters'],
      urgencySignals: [],
    };

    const parsed = DomainRoutingZodSchema.parse(uncertainData);
    expect(parsed.jurisdictionConfidence).toBeLessThan(0.5);
    expect(parsed.missingInformation).toContain('State of employment');
  });

  it('rejects invalid jurisdiction confidence values outside 0-1', () => {
    const invalid = {
      ...validDomainData,
      jurisdictionConfidence: 1.5,
    };
    expect(() => DomainRoutingZodSchema.parse(invalid)).toThrow();
  });

  it('runs runDomainRouting and successfully parses model output', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(validDomainData),
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const result = await runDomainRouting({
      narrative: 'My landlord in Austin, TX withheld my deposit.',
      facts: ['Security deposit of $1500 was paid', 'Tenant vacated on June 30'],
      locationHint: 'Texas',
    });

    expect(result.data.domain).toBe('Housing & Tenancy');
    expect(result.data.jurisdiction).toBe('Texas, United States');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
