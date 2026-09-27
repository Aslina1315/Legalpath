"""Firebase Admin SDK helpers.

This project does not rely on server-side Firebase Admin for its active path. These functions
exist as typed, safe guardrails and fail clearly when backend Firebase configuration is absent.
"""

from __future__ import annotations

import os


class FirebaseAdminConfigurationError(RuntimeError):
    """Raised when server-side Firebase Admin is not configured."""


def get_firestore_client() -> dict[str, object]:
    """Return a typed config envelope when Firebase Admin is enabled on the backend."""
    project_id = (os.getenv("FIREBASE_PROJECT_ID") or "").strip()
    if not project_id:
        raise FirebaseAdminConfigurationError(
            "Firebase Admin is not configured on the backend; the active deployment uses the browser Firebase client."
        )

    return {"project_id": project_id, "configured": True}


def verify_firebase_token(id_token: str) -> dict[str, object]:
    """Validate the input contract without pretending to verify a real token.

    Real Firebase Auth token verification remains an optional future enhancement and is not part
    of the current client-driven deployment architecture.
    """
    if not id_token or not id_token.strip():
        raise ValueError("id_token is required.")

    return {
        "verified": False,
        "token_type": "firebase_id_token",
        "warning": "Server-side token verification is not active in the current deployment.",
    }
