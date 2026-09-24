"""
Firebase Admin SDK integration — STUB.

Will provide:
  - Firestore client (server-side)
  - Firebase Auth token verification
  - Firebase Storage client (future)

Status: STUB — not yet implemented.
Requires: GOOGLE_APPLICATION_CREDENTIALS env var or Workload Identity (Cloud Run).
"""


def get_firestore_client() -> None:
    """
    Returns an initialized Firestore client.
    PLANNED: Will use firebase-admin SDK.
    """
    raise NotImplementedError("Firebase Admin integration will be implemented in Stage 2.")


def verify_firebase_token(id_token: str) -> dict[str, object]:
    """
    Verifies a Firebase Auth ID token.
    PLANNED: Will use firebase_admin.auth.verify_id_token().

    Args:
        id_token: JWT token from Firebase Auth client SDK.

    Returns:
        Decoded token claims.
    """
    raise NotImplementedError("Token verification will be implemented in Stage 2.")
