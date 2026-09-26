/**
 * Module 13: Human Help Bridge Tests
 * Validates official legal aid and statutory services resolution,
 * non-marketplace principles, and fallback notices.
 */

import { resolveHumanHelpResources } from '@/lib/ai/humanHelpModule';

describe('Module 13: Human Help Bridge', () => {
  it('resolves UK official resources for England & Wales jurisdiction', () => {
    const res = resolveHumanHelpResources({
      jurisdiction: 'England and Wales',
      domain: 'Housing & Tenancy',
      reasoning: 'Disputed eviction notice requires statutory review.',
    });

    expect(res.jurisdiction).toContain('United Kingdom');
    expect(res.headline).toBe('AI has reached the point where human help may be useful.');
    expect(res.officialResources.length).toBeGreaterThan(0);
    expect(res.officialResources.some((r) => r.name.includes('Legal Aid'))).toBe(true);
    expect(res.officialResources.some((r) => r.name.includes('Citizens Advice'))).toBe(true);
    expect(res.nonAdvocateDisclaimer).toContain('does not provide legal representation');
  });

  it('resolves US official resources for Texas jurisdiction', () => {
    const res = resolveHumanHelpResources({
      jurisdiction: 'Austin, Texas, United States',
      domain: 'Housing & Tenancy',
    });

    expect(res.jurisdiction).toContain('United States');
    expect(res.officialResources.some((r) => r.name.includes('Legal Services Corporation'))).toBe(true);
    expect(res.officialResources.some((r) => r.name.includes('LawHelp.org'))).toBe(true);
  });

  it('provides clear notice when specific local data is general/fallback', () => {
    const res = resolveHumanHelpResources({
      jurisdiction: 'Other International Location',
    });

    expect(res.locationNotice).toContain('Specific municipal legal aid records are unavailable');
    expect(res.officialResources.length).toBeGreaterThan(0);
  });
});
