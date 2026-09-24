"""
Intake service — PLANNED.

Will orchestrate:
  - Narrative preprocessing
  - Language detection
  - AI Module 01: Intake Understanding
  - AI Module 02: Case Structuring
  - Initial Firestore case document creation

Status: STUB — not yet implemented.
"""


async def process_intake(narrative: str, user_id: str) -> None:
    """
    Process user narrative through the intake AI pipeline.

    Args:
        narrative: Raw user-submitted narrative text.
        user_id: Firebase Auth UID of the submitting user.

    Raises:
        NotImplementedError: Until Stage 2 is implemented.
    """
    raise NotImplementedError("Intake service will be implemented in Stage 2.")
