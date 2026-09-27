"""Intake service helpers for the backend scaffold.

The deployed product currently runs the legal intake workflow in the browser via the
Firebase AI Logic client. This service remains intentionally lightweight so the backend
can validate request shape without pretending to duplicate the production frontend pipeline.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class IntakeResult(BaseModel):
    """Minimal typed contract for a backend intake request."""

    model_config = ConfigDict(frozen=True)

    status: Literal["accepted"] = "accepted"
    user_id: str
    narrative_length: int
    summary: str = "Narrative accepted for backend processing; client-side AI pipeline remains active."


async def process_intake(narrative: str, user_id: str) -> IntakeResult:
    """Validate request payload without duplicating the production AI flow.

    This is a guardrail for backend scaffolding only. The application currently relies on the
    Firebase AI client in the browser, so this function does not trigger a second Gemini pipeline.
    """
    normalized = (narrative or "").strip()
    if not user_id or not user_id.strip():
        raise ValueError("user_id is required.")
    if len(normalized) < 10:
        raise ValueError("narrative must contain at least 10 characters.")

    return IntakeResult(
        user_id=user_id.strip(),
        narrative_length=len(normalized),
    )
