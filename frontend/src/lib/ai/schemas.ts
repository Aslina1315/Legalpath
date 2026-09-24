/**
 * AI response schemas.
 * Each schema has:
 *   1. A Zod schema for runtime validation on the client
 *   2. A Firebase AI responseSchema for structured output mode
 */

import { z } from 'zod';
import type { Schema } from 'firebase/ai';
import { SchemaType } from 'firebase/ai';
import type {
  DomainRoutingResult,
  KnowledgeRetrievalResult,
  EvidenceAnalysisResult,
  EvidenceGapResult,
  ContradictionResult,
  ResponseVerificationResult,
  ActionPathResult,
} from '@/types/ai';

// ─── System Readiness Schema ─────────────────────────────────────────────────

export const SystemReadinessZodSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  model: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

export type SystemReadinessSchema = z.infer<typeof SystemReadinessZodSchema>;

export const SYSTEM_READINESS_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    status: { type: SchemaType.STRING, enum: ['ok', 'degraded'], nullable: false },
    model: { type: SchemaType.STRING, nullable: false },
    message: { type: SchemaType.STRING, nullable: false },
    timestamp: { type: SchemaType.STRING, nullable: false },
  },
  required: ['status', 'model', 'message', 'timestamp'],
  nullable: false,
};

// ─── Case Intake Schema (Module 01) ──────────────────────────────────────────

export const CaseIntakeZodSchema = z.object({
  summary: z.string(),
  detectedJurisdiction: z.string().optional(),
  legalDomains: z.array(z.string()),
  keyFacts: z.array(z.string()),
  entities: z.array(z.object({
    name: z.string(),
    role: z.string(),
  })),
  urgencyLevel: z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']),
  clarificationNeeded: z.array(z.string()),
});

export type CaseIntakeResult = z.infer<typeof CaseIntakeZodSchema>;

export const CASE_INTAKE_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING, nullable: false },
    detectedJurisdiction: { type: SchemaType.STRING, nullable: true },
    legalDomains: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    keyFacts: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, nullable: false },
          role: { type: SchemaType.STRING, nullable: false },
        },
        required: ['name', 'role'],
        nullable: false,
      },
      nullable: false,
    },
    urgencyLevel: {
      type: SchemaType.STRING,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
      nullable: false,
    },
    clarificationNeeded: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
  },
  required: ['summary', 'legalDomains', 'keyFacts', 'entities', 'urgencyLevel', 'clarificationNeeded'],
  nullable: false,
};

// ─── Case Structure Schema (Module 02) ────────────────────────────────────────

const TimelineEventZod = z.object({
  description: z.string(),
  date: z.string().optional(),
  approximateDate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

const StructuredEntityZod = z.object({
  name: z.string(),
  role: z.enum(['CLAIMANT', 'RESPONDENT', 'WITNESS', 'THIRD_PARTY', 'INSTITUTION', 'OTHER']),
  notes: z.string().optional(),
});

const StructuredFactZod = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
});

export const CaseStructureZodSchema = z.object({
  timeline: z.array(TimelineEventZod),
  entities: z.array(StructuredEntityZod),
  structuredFacts: z.array(StructuredFactZod),
  evidenceAvailable: z.array(z.string()),
  evidenceMissing: z.array(z.string()),
});

export type CaseStructureResult = z.infer<typeof CaseStructureZodSchema>;

export const CASE_STRUCTURE_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    timeline: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          description: { type: SchemaType.STRING, nullable: false },
          date: { type: SchemaType.STRING, nullable: true },
          approximateDate: { type: SchemaType.STRING, nullable: true },
          confidence: { type: SchemaType.NUMBER, nullable: false },
        },
        required: ['description', 'confidence'],
        nullable: false,
      },
      nullable: false,
    },
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, nullable: false },
          role: {
            type: SchemaType.STRING,
            enum: ['CLAIMANT', 'RESPONDENT', 'WITNESS', 'THIRD_PARTY', 'INSTITUTION', 'OTHER'],
            nullable: false,
          },
          notes: { type: SchemaType.STRING, nullable: true },
        },
        required: ['name', 'role'],
        nullable: false,
      },
      nullable: false,
    },
    structuredFacts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, nullable: false },
          confidence: { type: SchemaType.NUMBER, nullable: false },
        },
        required: ['text', 'confidence'],
        nullable: false,
      },
      nullable: false,
    },
    evidenceAvailable: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    evidenceMissing: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
  },
  required: ['timeline', 'entities', 'structuredFacts', 'evidenceAvailable', 'evidenceMissing'],
  nullable: false,
};

// ─── Module 03: Legal Domain & Jurisdiction Routing ──────────────────────────

export const DomainRoutingZodSchema: z.ZodType<DomainRoutingResult> = z.object({
  domain: z.string(),
  subDomain: z.string(),
  jurisdiction: z.string(),
  jurisdictionConfidence: z.number().min(0).max(1),
  reasoningSummary: z.string(),
  missingInformation: z.array(z.string()),
  urgencySignals: z.array(z.string()),
});

export const DOMAIN_ROUTING_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    domain: { type: SchemaType.STRING, nullable: false },
    subDomain: { type: SchemaType.STRING, nullable: false },
    jurisdiction: { type: SchemaType.STRING, nullable: false },
    jurisdictionConfidence: { type: SchemaType.NUMBER, nullable: false },
    reasoningSummary: { type: SchemaType.STRING, nullable: false },
    missingInformation: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    urgencySignals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
  },
  required: [
    'domain',
    'subDomain',
    'jurisdiction',
    'jurisdictionConfidence',
    'reasoningSummary',
    'missingInformation',
    'urgencySignals',
  ],
  nullable: false,
};

// ─── Module 05: Live Knowledge Retrieval ────────────────────────────────────

const KnowledgeSourceZod = z.object({
  title: z.string(),
  url: z.string(),
  sourceType: z.enum(['statute', 'guidance', 'case_law', 'official_portal', 'other']),
  publisher: z.string().optional(),
  retrievedAt: z.string(),
  relevance: z.string(),
  summary: z.string(),
});

export const KnowledgeRetrievalZodSchema: z.ZodType<KnowledgeRetrievalResult> = z.object({
  status: z.enum(['verified_sources_found', 'no_verified_source']),
  queryUsed: z.string(),
  keyFindings: z.array(z.string()),
  sources: z.array(KnowledgeSourceZod),
  applicableRules: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const KNOWLEDGE_RETRIEVAL_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    status: {
      type: SchemaType.STRING,
      enum: ['verified_sources_found', 'no_verified_source'],
      nullable: false,
    },
    queryUsed: { type: SchemaType.STRING, nullable: false },
    keyFindings: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    sources: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, nullable: false },
          url: { type: SchemaType.STRING, nullable: false },
          sourceType: {
            type: SchemaType.STRING,
            enum: ['statute', 'guidance', 'case_law', 'official_portal', 'other'],
            nullable: false,
          },
          publisher: { type: SchemaType.STRING, nullable: true },
          retrievedAt: { type: SchemaType.STRING, nullable: false },
          relevance: { type: SchemaType.STRING, nullable: false },
          summary: { type: SchemaType.STRING, nullable: false },
        },
        required: ['title', 'url', 'sourceType', 'retrievedAt', 'relevance', 'summary'],
        nullable: false,
      },
      nullable: false,
    },
    applicableRules: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    limitations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
  },
  required: ['status', 'queryUsed', 'keyFindings', 'sources', 'applicableRules', 'limitations'],
  nullable: false,
};

// ─── Module 06: Evidence Analyzer ───────────────────────────────────────────

export const EvidenceAnalysisZodSchema: z.ZodType<EvidenceAnalysisResult> = z.object({
  documentType: z.string(),
  dates: z.array(z.object({ date: z.string(), context: z.string() })),
  amounts: z.array(z.object({ amount: z.string(), context: z.string() })),
  peopleOrEntities: z.array(z.object({ name: z.string(), role: z.string() })),
  importantStatements: z.array(z.string()),
  relevantClauses: z.array(z.string()),
  evidenceItems: z.array(z.object({
    item: z.string(),
    significance: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  confidence: z.number().min(0).max(1),
  uncertainItems: z.array(z.string()),
});

export const EVIDENCE_ANALYSIS_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    documentType: { type: SchemaType.STRING, nullable: false },
    dates: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING, nullable: false },
          context: { type: SchemaType.STRING, nullable: false },
        },
        required: ['date', 'context'],
        nullable: false,
      },
      nullable: false,
    },
    amounts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          amount: { type: SchemaType.STRING, nullable: false },
          context: { type: SchemaType.STRING, nullable: false },
        },
        required: ['amount', 'context'],
        nullable: false,
      },
      nullable: false,
    },
    peopleOrEntities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, nullable: false },
          role: { type: SchemaType.STRING, nullable: false },
        },
        required: ['name', 'role'],
        nullable: false,
      },
      nullable: false,
    },
    importantStatements: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    relevantClauses: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    evidenceItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING, nullable: false },
          significance: { type: SchemaType.STRING, nullable: false },
          confidence: { type: SchemaType.NUMBER, nullable: false },
        },
        required: ['item', 'significance', 'confidence'],
        nullable: false,
      },
      nullable: false,
    },
    confidence: { type: SchemaType.NUMBER, nullable: false },
    uncertainItems: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
  },
  required: [
    'documentType',
    'dates',
    'amounts',
    'peopleOrEntities',
    'importantStatements',
    'relevantClauses',
    'evidenceItems',
    'confidence',
    'uncertainItems',
  ],
  nullable: false,
};

// ─── Module 07: Evidence Gap Detector ───────────────────────────────────────

export const EvidenceGapZodSchema: z.ZodType<EvidenceGapResult> = z.object({
  gaps: z.array(z.object({
    id: z.string(),
    gapType: z.enum(['MISSING_DOCUMENT', 'MISSING_DATE', 'MISSING_COMMUNICATION', 'UNSUBSTANTIATED_CLAIM', 'OTHER']),
    description: z.string(),
    importance: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    whyItMatters: z.string(),
    suggestedClarification: z.string(),
  })),
  overallCompleteness: z.number().min(0).max(1),
  summary: z.string(),
});

export const EVIDENCE_GAP_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    gaps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, nullable: false },
          gapType: {
            type: SchemaType.STRING,
            enum: ['MISSING_DOCUMENT', 'MISSING_DATE', 'MISSING_COMMUNICATION', 'UNSUBSTANTIATED_CLAIM', 'OTHER'],
            nullable: false,
          },
          description: { type: SchemaType.STRING, nullable: false },
          importance: {
            type: SchemaType.STRING,
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            nullable: false,
          },
          whyItMatters: { type: SchemaType.STRING, nullable: false },
          suggestedClarification: { type: SchemaType.STRING, nullable: false },
        },
        required: ['id', 'gapType', 'description', 'importance', 'whyItMatters', 'suggestedClarification'],
        nullable: false,
      },
      nullable: false,
    },
    overallCompleteness: { type: SchemaType.NUMBER, nullable: false },
    summary: { type: SchemaType.STRING, nullable: false },
  },
  required: ['gaps', 'overallCompleteness', 'summary'],
  nullable: false,
};

// ─── Module 08: Contradiction Detector ──────────────────────────────────────

export const ContradictionZodSchema: z.ZodType<ContradictionResult> = z.object({
  hasContradictions: z.boolean(),
  contradictions: z.array(z.object({
    id: z.string(),
    field: z.string(),
    sourceA: z.string(),
    valueA: z.string(),
    sourceB: z.string(),
    valueB: z.string(),
    severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    explanation: z.string(),
    clarificationNeeded: z.string(),
  })),
  summary: z.string(),
});

export const CONTRADICTION_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    hasContradictions: { type: SchemaType.BOOLEAN, nullable: false },
    contradictions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, nullable: false },
          field: { type: SchemaType.STRING, nullable: false },
          sourceA: { type: SchemaType.STRING, nullable: false },
          valueA: { type: SchemaType.STRING, nullable: false },
          sourceB: { type: SchemaType.STRING, nullable: false },
          valueB: { type: SchemaType.STRING, nullable: false },
          severity: {
            type: SchemaType.STRING,
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            nullable: false,
          },
          explanation: { type: SchemaType.STRING, nullable: false },
          clarificationNeeded: { type: SchemaType.STRING, nullable: false },
        },
        required: ['id', 'field', 'sourceA', 'valueA', 'sourceB', 'valueB', 'severity', 'explanation', 'clarificationNeeded'],
        nullable: false,
      },
      nullable: false,
    },
    summary: { type: SchemaType.STRING, nullable: false },
  },
  required: ['hasContradictions', 'contradictions', 'summary'],
  nullable: false,
};

// ─── Module 09: AI Response Verifier ────────────────────────────────────────

export const ResponseVerificationZodSchema: z.ZodType<ResponseVerificationResult> = z.object({
  claims: z.array(z.object({
    claim: z.string(),
    status: z.enum(['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED', 'UNCERTAIN']),
    supportingSources: z.array(z.string()),
    caseFactAlignment: z.boolean(),
    jurisdictionConsistency: z.boolean(),
    reasoning: z.string(),
  })),
  overallTrustScore: z.number().min(0).max(1),
  verifiedSummary: z.string(),
  unsupportedClaimsFlagged: z.array(z.string()),
  disclaimer: z.string(),
});

export const RESPONSE_VERIFICATION_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    claims: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          claim: { type: SchemaType.STRING, nullable: false },
          status: {
            type: SchemaType.STRING,
            enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED', 'UNCERTAIN'],
            nullable: false,
          },
          supportingSources: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING, nullable: false },
            nullable: false,
          },
          caseFactAlignment: { type: SchemaType.BOOLEAN, nullable: false },
          jurisdictionConsistency: { type: SchemaType.BOOLEAN, nullable: false },
          reasoning: { type: SchemaType.STRING, nullable: false },
        },
        required: ['claim', 'status', 'supportingSources', 'caseFactAlignment', 'jurisdictionConsistency', 'reasoning'],
        nullable: false,
      },
      nullable: false,
    },
    overallTrustScore: { type: SchemaType.NUMBER, nullable: false },
    verifiedSummary: { type: SchemaType.STRING, nullable: false },
    unsupportedClaimsFlagged: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    disclaimer: { type: SchemaType.STRING, nullable: false },
  },
  required: ['claims', 'overallTrustScore', 'verifiedSummary', 'unsupportedClaimsFlagged', 'disclaimer'],
  nullable: false,
};

// ─── Module 10: Action Path ─────────────────────────────────────────────────

export const ActionPathZodSchema: z.ZodType<ActionPathResult> = z.object({
  currentSituation: z.string(),
  nextSteps: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    whyItMatters: z.string(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
    estimatedTimeframe: z.string().optional(),
  })),
  documentsNeeded: z.array(z.object({
    documentName: z.string(),
    purpose: z.string(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  })),
  questionsToResolve: z.array(z.string()),
  possibleEscalation: z.array(z.object({
    route: z.string(),
    condition: z.string(),
    advisoryNote: z.string(),
  })),
  humanHelpRecommended: z.boolean(),
  humanHelpReasoning: z.string().optional(),
});

export const ACTION_PATH_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    currentSituation: { type: SchemaType.STRING, nullable: false },
    nextSteps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, nullable: false },
          title: { type: SchemaType.STRING, nullable: false },
          description: { type: SchemaType.STRING, nullable: false },
          whyItMatters: { type: SchemaType.STRING, nullable: false },
          priority: {
            type: SchemaType.STRING,
            enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
            nullable: false,
          },
          status: {
            type: SchemaType.STRING,
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            nullable: false,
          },
          estimatedTimeframe: { type: SchemaType.STRING, nullable: true },
        },
        required: ['id', 'title', 'description', 'whyItMatters', 'priority', 'status'],
        nullable: false,
      },
      nullable: false,
    },
    documentsNeeded: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          documentName: { type: SchemaType.STRING, nullable: false },
          purpose: { type: SchemaType.STRING, nullable: false },
          priority: {
            type: SchemaType.STRING,
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            nullable: false,
          },
        },
        required: ['documentName', 'purpose', 'priority'],
        nullable: false,
      },
      nullable: false,
    },
    questionsToResolve: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    possibleEscalation: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          route: { type: SchemaType.STRING, nullable: false },
          condition: { type: SchemaType.STRING, nullable: false },
          advisoryNote: { type: SchemaType.STRING, nullable: false },
        },
        required: ['route', 'condition', 'advisoryNote'],
        nullable: false,
      },
      nullable: false,
    },
    humanHelpRecommended: { type: SchemaType.BOOLEAN, nullable: false },
    humanHelpReasoning: { type: SchemaType.STRING, nullable: true },
  },
  required: [
    'currentSituation',
    'nextSteps',
    'documentsNeeded',
    'questionsToResolve',
    'possibleEscalation',
    'humanHelpRecommended',
  ],
  nullable: false,
};
