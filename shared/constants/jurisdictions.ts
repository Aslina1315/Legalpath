/**
 * Supported jurisdiction codes.
 * Uses ISO 3166-1 alpha-2 (country) and ISO 3166-2 (subdivision) notation.
 *
 * CURRENT STATUS: Placeholder list — not used for any validation yet.
 * FUTURE: Will be expanded and used in jurisdiction detection (AI Module 04).
 */

export interface Jurisdiction {
  /** ISO 3166-1/2 code */
  code: string;
  /** Display name */
  name: string;
  /** Country code */
  country: string;
  /** Whether this jurisdiction is actively supported (future) */
  supported: boolean;
}

export const JURISDICTIONS: readonly Jurisdiction[] = [
  // United Kingdom
  { code: 'GB-ENG', name: 'England and Wales', country: 'GB', supported: false },
  { code: 'GB-SCT', name: 'Scotland', country: 'GB', supported: false },
  { code: 'GB-NIR', name: 'Northern Ireland', country: 'GB', supported: false },

  // United States
  { code: 'US', name: 'United States (Federal)', country: 'US', supported: false },
  { code: 'US-CA', name: 'California', country: 'US', supported: false },
  { code: 'US-NY', name: 'New York', country: 'US', supported: false },
  { code: 'US-TX', name: 'Texas', country: 'US', supported: false },
  { code: 'US-FL', name: 'Florida', country: 'US', supported: false },

  // India
  { code: 'IN', name: 'India (Central)', country: 'IN', supported: false },
  { code: 'IN-DL', name: 'Delhi', country: 'IN', supported: false },
  { code: 'IN-MH', name: 'Maharashtra', country: 'IN', supported: false },

  // Australia
  { code: 'AU', name: 'Australia (Federal)', country: 'AU', supported: false },
  { code: 'AU-NSW', name: 'New South Wales', country: 'AU', supported: false },
  { code: 'AU-VIC', name: 'Victoria', country: 'AU', supported: false },

  // Canada
  { code: 'CA', name: 'Canada (Federal)', country: 'CA', supported: false },
  { code: 'CA-ON', name: 'Ontario', country: 'CA', supported: false },
  { code: 'CA-BC', name: 'British Columbia', country: 'CA', supported: false },

  // European Union
  { code: 'EU', name: 'European Union', country: 'EU', supported: false },
] as const;

export type JurisdictionCode = (typeof JURISDICTIONS)[number]['code'];

/** Look up a jurisdiction by code */
export function getJurisdiction(code: string): Jurisdiction | undefined {
  return JURISDICTIONS.find((j) => j.code === code);
}
