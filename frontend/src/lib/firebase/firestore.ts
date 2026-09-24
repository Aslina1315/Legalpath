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
import { db } from './firebase';
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
export async function createCase(
  userId: string,
  draft: Omit<CaseDraft, 'caseId' | 'userId'>
): Promise<string> {
  const ref: DocumentReference = doc(collection(db, CASES_COLLECTION));
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
    },
    structuredFacts: draft.structuredFacts,
    entities: draft.entities,
    aiPipelineVersion: draft.aiPipelineVersion ?? '2.0',
  };

  await setDoc(ref, {
    ...caseDoc,
    // Use server timestamp for audit purposes alongside our ISO string
    _serverCreatedAt: serverTimestamp(),
  });

  return caseId;
}

// ─── Case Retrieval ──────────────────────────────────────────────────────────

/**
 * Fetches a single case by ID.
 * Returns null if the document does not exist.
 */
export async function getCaseById(caseId: string): Promise<Case | null> {
  const ref = doc(db, CASES_COLLECTION, caseId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as Case & { _serverCreatedAt?: Timestamp };
  // Strip the internal server timestamp field before returning
  const { _serverCreatedAt: _ignored, ...caseData } = data;
  void _ignored;
  return caseData;
}
