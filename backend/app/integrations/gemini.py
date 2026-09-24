"""
Gemini API integration — STUB.

Server-side Gemini integration will use:
  - google-generativeai or google-cloud-aiplatform SDK
  - Service account credentials (Workload Identity on Cloud Run)
  - Secret Manager for API key (not environment variables)

For now: all AI calls go through Firebase AI Logic (client SDK).
This server-side integration is for future backend-driven AI pipeline stages.

Status: STUB — not yet implemented.
"""


def get_gemini_client() -> None:
    """
    Returns an initialized Gemini client.
    PLANNED: Will use google-generativeai or Vertex AI SDK.
    """
    raise NotImplementedError("Server-side Gemini integration will be implemented in Stage 3.")
