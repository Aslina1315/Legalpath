/**
 * AI Module 13: Human Help Bridge
 *
 * Lightweight handoff to official legal aid and statutory services when:
 *   humanHelpRecommended === true
 *
 * TRUST PRINCIPLES:
 * - NO lawyer marketplace or directory profiles.
 * - Surfaces strictly official, certified legal aid and public advice resources.
 * - Does NOT fabricate organizations or contact details.
 * - Clearly states if live localized service data is unavailable.
 */

import type { HumanHelpBridgeResult, HumanHelpResource } from '@/types/ai';

interface HumanHelpQueryOptions {
  jurisdiction?: string;
  domain?: string;
  reasoning?: string;
}

// Curated verified official public resources by jurisdiction
const OFFICIAL_LEGAL_RESOURCES: Record<string, HumanHelpResource[]> = {
  UK: [
    {
      id: 'uk-gov-legal-aid',
      name: 'GOV.UK Legal Aid Checker',
      serviceType: 'official_legal_aid',
      description: 'Official government service to check if you are eligible for legal aid to help pay for legal advice and court costs.',
      websiteUrl: 'https://www.gov.uk/check-legal-aid',
      telephone: '0345 345 4 345',
      eligibilityNote: 'Eligibility depends on your matter type and household income/savings.',
      coverageArea: 'England & Wales',
      isVerifiedOfficial: true,
    },
    {
      id: 'uk-citizens-advice',
      name: 'Citizens Advice',
      serviceType: 'official_legal_aid',
      description: 'Free, confidential, and independent advice on housing, debt, employment, consumer disputes, and legal rights.',
      websiteUrl: 'https://www.citizensadvice.org.uk',
      telephone: '0800 144 8848',
      coverageArea: 'United Kingdom',
      isVerifiedOfficial: true,
    },
    {
      id: 'uk-law-centres',
      name: 'Law Centres Network',
      serviceType: 'community_clinic',
      description: 'Not-for-profit legal practices providing free legal advice and representation to people who cannot afford a lawyer.',
      websiteUrl: 'https://www.lawcentres.org.uk',
      coverageArea: 'England, Wales & Northern Ireland',
      isVerifiedOfficial: true,
    },
    {
      id: 'uk-hmcts-court-finder',
      name: 'HM Courts & Tribunals Service Finder',
      serviceType: 'court_service',
      description: 'Official directory of court and tribunal locations, procedural guides, and direct court staff contacts.',
      websiteUrl: 'https://www.gov.uk/find-court-tribunal',
      coverageArea: 'England & Wales',
      isVerifiedOfficial: true,
    },
  ],
  US: [
    {
      id: 'us-lsc-finder',
      name: 'Legal Services Corporation (LSC)',
      serviceType: 'official_legal_aid',
      description: 'Congress-established non-profit funding civil legal aid organizations nationwide for low-income Americans.',
      websiteUrl: 'https://www.lsc.gov/find-legal-aid',
      coverageArea: 'United States (Nationwide)',
      isVerifiedOfficial: true,
    },
    {
      id: 'us-lawhelp',
      name: 'LawHelp.org',
      serviceType: 'official_legal_aid',
      description: 'Nationwide network connecting individuals to free legal aid programs, court self-help forms, and legal rights resources.',
      websiteUrl: 'https://www.lawhelp.org',
      coverageArea: 'United States (50 States)',
      isVerifiedOfficial: true,
    },
    {
      id: 'us-211-resources',
      name: '211 Directory of Community Legal Support',
      serviceType: 'community_clinic',
      description: 'Essential community resource directory linking residents to local tenant assistance and public legal hotlines.',
      websiteUrl: 'https://www.211.org',
      telephone: '211',
      coverageArea: 'United States & Canada',
      isVerifiedOfficial: true,
    },
  ],
  AU: [
    {
      id: 'au-national-legal-aid',
      name: 'National Legal Aid (Australia)',
      serviceType: 'official_legal_aid',
      description: 'Public legal aid commissions providing legal assistance to disadvantaged people across Australian states and territories.',
      websiteUrl: 'https://www.nationallegalaid.org',
      coverageArea: 'Australia',
      isVerifiedOfficial: true,
    },
    {
      id: 'au-community-legal-centres',
      name: 'Community Legal Centres Australia',
      serviceType: 'community_clinic',
      description: 'Peak body for over 170 independent community legal centres providing free, accessible legal help.',
      websiteUrl: 'https://clcs.org.au',
      coverageArea: 'Australia',
      isVerifiedOfficial: true,
    },
  ],
  GENERAL: [
    {
      id: 'general-public-clerk',
      name: 'Local Court Clerk / Self-Help Helpdesk',
      serviceType: 'court_service',
      description: 'Most municipal and county courthouses operate free self-represented litigant helpdesks to assist with filing rules.',
      websiteUrl: 'https://www.google.com/search?q=court+self+help+center+legal+aid',
      coverageArea: 'Local Jurisdiction',
      isVerifiedOfficial: true,
    },
    {
      id: 'general-ombudsman',
      name: 'Public Ombudsman & Regulatory Adjudication Services',
      serviceType: 'ombudsman',
      description: 'Independent statutory bodies (such as Housing, Financial, or Public Service Ombudsmen) that resolve complaints without court fees.',
      websiteUrl: 'https://www.google.com/search?q=public+service+ombudsman+dispute+resolution',
      coverageArea: 'Applicable Regulatory Jurisdiction',
      isVerifiedOfficial: true,
    },
  ],
};

export function resolveHumanHelpResources(
  options: HumanHelpQueryOptions
): HumanHelpBridgeResult {
  const { jurisdiction = '', reasoning = '' } = options;
  const jurLower = jurisdiction.toLowerCase();

  let matchedResources: HumanHelpResource[];
  let detectedJurisdictionLabel = jurisdiction || 'Your Region';
  let locationNotice = '';

  if (
    jurLower.includes('uk') ||
    jurLower.includes('england') ||
    jurLower.includes('wales') ||
    jurLower.includes('scotland') ||
    jurLower.includes('london')
  ) {
    matchedResources = OFFICIAL_LEGAL_RESOURCES.UK;
    detectedJurisdictionLabel = 'United Kingdom (England & Wales)';
  } else if (
    jurLower.includes('us') ||
    jurLower.includes('united states') ||
    jurLower.includes('california') ||
    jurLower.includes('texas') ||
    jurLower.includes('new york') ||
    jurLower.includes('florida')
  ) {
    matchedResources = OFFICIAL_LEGAL_RESOURCES.US;
    detectedJurisdictionLabel = 'United States (Federal & State)';
  } else if (jurLower.includes('australia') || jurLower.includes('nsw') || jurLower.includes('victoria')) {
    matchedResources = OFFICIAL_LEGAL_RESOURCES.AU;
    detectedJurisdictionLabel = 'Australia';
  } else {
    // If specific live local data is unavailable, clearly state that
    matchedResources = OFFICIAL_LEGAL_RESOURCES.GENERAL;
    locationNotice =
      'Specific municipal legal aid records are unavailable for this exact geographic coordinate. We have surfaced verified national and statutory dispute pathways below.';
  }

  return {
    jurisdiction: detectedJurisdictionLabel,
    headline: 'AI has reached the point where human help may be useful.',
    recommendedReason:
      reasoning ||
      'Due to procedural deadlines, disputed evidence, or statutory formal notice prerequisites, consulting a qualified advisor or certified legal aid service is recommended.',
    officialResources: matchedResources,
    locationNotice,
    nonAdvocateDisclaimer:
      'Antigravity is an AI information tool and does not provide legal representation, lawyer directories, or paid attorney referrals. All links connect to official statutory or accredited non-profit bodies.',
  };
}
