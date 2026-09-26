/**
 * Firestore helpers.
 * Handles reading and writing case documents.
 *
 * Collection structure:
 *   cases/{caseId}   — root case document
 *
 * Security: Firestore rules (not yet deployed) will enforce that
 * users can only read/write their own cases via userId field.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  type DocumentReference,
  type Timestamp,
} from 'firebase/firestore';
import { getDbInstance } from './firebase';
import type { Case, CaseDraft } from '@/types/case';

const CASES_COLLECTION = 'cases';

// ─── Case Creation ───────────────────────────────────────────────────────────

/**
 * Creates a new case document in Firestore.
 * Generates a unique caseId using Firestore's auto-ID.
 *
 * @param userId  Firebase Auth UID of the case owner.
 * @param draft   Partial case data (narrative etc.) from intake.
 * @returns       The caseId of the newly created document.
 */
function requireDb(): NonNullable<ReturnType<typeof getDbInstance>> {
  const dbInstance = getDbInstance();
  if (!dbInstance) {
    throw new Error('Firestore is unavailable because Firebase is not configured in this browser session.');
  }
  return dbInstance;
}

export async function createCase(
  userId: string,
  draft: Omit<CaseDraft, 'caseId' | 'userId'>
): Promise<string> {
  const currentDb = requireDb();
  const ref: DocumentReference = doc(collection(currentDb, CASES_COLLECTION));
  const caseId = ref.id;

  const now = new Date().toISOString();

  const caseDoc: Case = {
    caseId,
    userId,
    narrative: draft.narrative,
    status: draft.status ?? 'INTAKE',
    jurisdiction: draft.jurisdiction,
    language: draft.language,
    timestamps: {
      createdAt: now,
      updatedAt: now,
      intakeCompletedAt: draft.timestamps?.intakeCompletedAt,
      analysisCompletedAt: draft.timestamps?.analysisCompletedAt,
    },
    structuredFacts: draft.structuredFacts,
    entities: draft.entities,
    timeline: draft.timeline,
    domainRouting: draft.domainRouting,
    knowledgeRetrieval: draft.knowledgeRetrieval,
    evidenceItems: draft.evidenceItems,
    evidenceGaps: draft.evidenceGaps,
    contradictions: draft.contradictions,
    responseVerification: draft.responseVerification,
    actionPath: draft.actionPath,
    generatedDocument: draft.generatedDocument,
    beforeSendReview: draft.beforeSendReview,
    humanHelpBridge: draft.humanHelpBridge,
    aiPipelineVersion: draft.aiPipelineVersion ?? '3.0',
  };

  await setDoc(ref, {
    ...caseDoc,
    // Use server timestamp for audit purposes alongside our ISO string
    _serverCreatedAt: serverTimestamp(),
  });

  return caseId;
}

/**
 * Updates an existing case in Firestore.
 */
export async function updateCase(
  caseId: string,
  patch: Partial<Case>
): Promise<void> {
  const currentDb = requireDb();
  const ref = doc(currentDb, CASES_COLLECTION, caseId);
  await setDoc(
    ref,
    {
      ...patch,
      'timestamps.updatedAt': new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Case Retrieval ──────────────────────────────────────────────────────────

/**
 * Fetches a single case by ID.
 * Returns null if the document does not exist.
 */
export async function getCaseById(caseId: string): Promise<Case | null> {
  const currentDb = requireDb();
  const ref = doc(currentDb, CASES_COLLECTION, caseId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as Case & { _serverCreatedAt?: Timestamp };
  // Strip the internal server timestamp field before returning
  const { _serverCreatedAt: _ignored, ...caseData } = data;
  void _ignored;
  return caseData;
}

/**
 * Deletes a case from Firestore.
 */
export async function deleteCase(caseId: string): Promise<void> {
  const currentDb = requireDb();
  const { deleteDoc } = await import('firebase/firestore');
  const ref = doc(currentDb, CASES_COLLECTION, caseId);
  await deleteDoc(ref);
}

