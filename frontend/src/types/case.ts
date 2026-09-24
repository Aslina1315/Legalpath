/**
 * Case model — typed interface for the future Firestore case document.
 * Fields are optional where they will be populated in later AI pipeline stages.
 */

export type CaseStatus =
  | 'DRAFT'
  | 'INTAKE'
  | 'ANALYZING'
  | 'STRUCTURED'
  | 'ACTION_READY'
  | 'CLOSED'
  | 'ARCHIVED';

export interface CaseTimestamps {
  createdAt: string; // ISO 8601
  updatedAt: string;
  intakeCompletedAt?: string;
  analysisCompletedAt?: string;
  closedAt?: string;
}

export interface StructuredFact {
  id: string;
  text: string;
  confidence: number; // 0–1
  sourceNarrativeOffset?: number;
}

export interface CaseEntity {
  id: string;
  name: string;
  role: 'CLAIMANT' | 'RESPONDENT' | 'WITNESS' | 'THIRD_PARTY' | 'INSTITUTION' | 'OTHER';
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  date?: string;
  approximateDate?: string;
  description: string;
  confidence: number;
}

export interface Evidence {
  id: string;
  type: 'DOCUMENT' | 'PHOTO' | 'VIDEO' | 'COMMUNICATION' | 'TESTIMONY' | 'OTHER';
  description: string;
  status: 'AVAILABLE' | 'MISSING' | 'PARTIAL';
  storageRef?: string; // Firebase Storage path, future
}

export interface EvidenceGap {
  id: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestion?: string;
}

export interface Contradiction {
  id: string;
  description: string;
  itemARef: string;
  itemBRef: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface LegalSource {
  id: string;
  title: string;
  url?: string;
  jurisdiction?: string;
  relevanceScore?: number;
  retrievedAt: string;
}

export interface VerificationRecord {
  id: string;
  claim: string;
  verified: boolean;
  confidence: number;
  sources: string[];
  notes?: string;
}

export interface ActionItem {
  id: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  deadline?: string;
  completed: boolean;
}

export interface GeneratedDocument {
  id: string;
  type: string;
  title: string;
  storageRef?: string; // Firebase Storage path, future
  generatedAt: string;
  version: number;
}

/** Root case document — mirrors future Firestore document structure */
export interface Case {
  caseId: string;
  userId: string;
  jurisdiction?: string;
  narrative: string;
  status: CaseStatus;
  timestamps: CaseTimestamps;

  // Populated by AI pipeline stages
  structuredFacts?: StructuredFact[];
  entities?: CaseEntity[];
  timeline?: TimelineEvent[];
  evidence?: Evidence[];
  gaps?: EvidenceGap[];
  contradictions?: Contradiction[];
  sources?: LegalSource[];
  verification?: VerificationRecord[];
  actionPlan?: ActionItem[];
  documents?: GeneratedDocument[];

  // Metadata
  language?: string; // BCP-47 language tag
  aiPipelineVersion?: string;
}

/** Partial case used during intake before caseId is assigned */
export type CaseDraft = Omit<Case, 'caseId' | 'userId'> & {
  caseId?: string;
  userId?: string;
};
