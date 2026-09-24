/**
 * AI processing state and response types.
 * These map to REAL backend/AI state changes — not fake timers.
 */

export type AIProcessingState =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'STRUCTURING'
  | 'RESEARCHING'
  | 'ANALYZING'
  | 'COMPARING'
  | 'VERIFYING'
  | 'PLANNING'
  | 'READY'
  | 'ERROR';

export interface AIStateMetadata {
  state: AIProcessingState;
  label: string;
  description: string;
  isTerminal: boolean;
  isError: boolean;
}

export const AI_STATE_METADATA: Record<AIProcessingState, AIStateMetadata> = {
  IDLE: {
    state: 'IDLE',
    label: 'Ready',
    description: 'Waiting for your situation details',
    isTerminal: false,
    isError: false,
  },
  UNDERSTANDING: {
    state: 'UNDERSTANDING',
    label: 'Understanding situation',
    description: 'Reading narrative and identifying key entities',
    isTerminal: false,
    isError: false,
  },
  STRUCTURING: {
    state: 'STRUCTURING',
    label: 'Structuring case',
    description: 'Extracting chronological timeline and factual claims',
    isTerminal: false,
    isError: false,
  },
  RESEARCHING: {
    state: 'RESEARCHING',
    label: 'Retrieving live knowledge',
    description: 'Querying official sources and applicable legal guidance',
    isTerminal: false,
    isError: false,
  },
  ANALYZING: {
    state: 'ANALYZING',
    label: 'Analyzing evidence',
    description: 'Examining uploaded documents and factual proof',
    isTerminal: false,
    isError: false,
  },
  COMPARING: {
    state: 'COMPARING',
    label: 'Detecting gaps & conflicts',
    description: 'Cross-referencing evidence against claims and timeline',
    isTerminal: false,
    isError: false,
  },
  VERIFYING: {
    state: 'VERIFYING',
    label: 'Verifying claims',
    description: 'Checking legal statements against retrieved authoritative sources',
    isTerminal: false,
    isError: false,
  },
  PLANNING: {
    state: 'PLANNING',
    label: 'Generating action path',
    description: 'Formulating step-by-step roadmap and prioritized checklist',
    isTerminal: false,
    isError: false,
  },
  READY: {
    state: 'READY',
    label: 'Analysis complete',
    description: 'Your continuous case workspace is ready',
    isTerminal: true,
    isError: false,
  },
  ERROR: {
    state: 'ERROR',
    label: 'Processing stopped',
    description: 'An issue occurred during analysis',
    isTerminal: true,
    isError: true,
  },
} as const;

/** Generic typed AI response wrapper */
export interface AIStructuredResponse<T> {
  data: T;
  model: string;
  generatedAt: string;
  promptTokens?: number;
  candidateTokens?: number;
}

/** Stream event from Firebase AI Logic generateContentStream */
export interface AIStreamChunk {
  text: string;
  isComplete: boolean;
  error?: string;
}

/** System readiness check response schema */
export interface SystemReadinessResponse {
  status: 'ok' | 'degraded';
  model: string;
  message: string;
  timestamp: string;
}

// ─── Module 03: Domain & Jurisdiction Routing ────────────────────────────────
export interface DomainRoutingResult {
  domain: string;
  subDomain: string;
  jurisdiction: string;
  jurisdictionConfidence: number; // 0.0 to 1.0
  reasoningSummary: string;
  missingInformation: string[];
  urgencySignals: string[];
}

// ─── Module 05: Live Knowledge Retrieval ────────────────────────────────────
export interface KnowledgeSource {
  title: string;
  url: string;
  sourceType: 'statute' | 'guidance' | 'case_law' | 'official_portal' | 'other';
  publisher?: string;
  retrievedAt: string;
  relevance: string;
  summary: string;
}

export interface KnowledgeRetrievalResult {
  status: 'verified_sources_found' | 'no_verified_source';
  queryUsed: string;
  keyFindings: string[];
  sources: KnowledgeSource[];
  applicableRules: string[];
  limitations: string[];
}

// ─── Module 06: Evidence Analyzer ───────────────────────────────────────────
export interface ExtractedEvidenceItem {
  item: string;
  significance: string;
  confidence: number;
}

export interface EvidenceAnalysisResult {
  documentType: string;
  dates: Array<{ date: string; context: string }>;
  amounts: Array<{ amount: string; context: string }>;
  peopleOrEntities: Array<{ name: string; role: string }>;
  importantStatements: string[];
  relevantClauses: string[];
  evidenceItems: ExtractedEvidenceItem[];
  confidence: number;
  uncertainItems: string[];
}

// ─── Module 07: Evidence Gap Detector ───────────────────────────────────────
export type GapType =
  | 'MISSING_DOCUMENT'
  | 'MISSING_DATE'
  | 'MISSING_COMMUNICATION'
  | 'UNSUBSTANTIATED_CLAIM'
  | 'OTHER';

export interface EvidenceGapItem {
  id: string;
  gapType: GapType;
  description: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  whyItMatters: string;
  suggestedClarification: string;
}

export interface EvidenceGapResult {
  gaps: EvidenceGapItem[];
  overallCompleteness: number; // 0.0 to 1.0
  summary: string;
}

// ─── Module 08: Contradiction Detector ──────────────────────────────────────
export interface ContradictionItem {
  id: string;
  field: string;
  sourceA: string;
  valueA: string;
  sourceB: string;
  valueB: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  clarificationNeeded: string;
}

export interface ContradictionResult {
  hasContradictions: boolean;
  contradictions: ContradictionItem[];
  summary: string;
}

// ─── Module 09: AI Response Verifier ────────────────────────────────────────
export type ClaimVerificationStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNSUPPORTED'
  | 'UNCERTAIN';

export interface ClaimVerification {
  claim: string;
  status: ClaimVerificationStatus;
  supportingSources: string[];
  caseFactAlignment: boolean;
  jurisdictionConsistency: boolean;
  reasoning: string;
}

export interface ResponseVerificationResult {
  claims: ClaimVerification[];
  overallTrustScore: number; // 0.0 to 1.0
  verifiedSummary: string;
  unsupportedClaimsFlagged: string[];
  disclaimer: string;
}

// ─── Module 10: Action Path ─────────────────────────────────────────────────
export interface ActionStep {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  estimatedTimeframe?: string;
}

export interface DocumentNeeded {
  documentName: string;
  purpose: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface EscalationOption {
  route: string;
  condition: string;
  advisoryNote: string;
}

export interface ActionPathResult {
  currentSituation: string;
  nextSteps: ActionStep[];
  documentsNeeded: DocumentNeeded[];
  questionsToResolve: string[];
  possibleEscalation: EscalationOption[];
  humanHelpRecommended: boolean;
  humanHelpReasoning?: string;
}
