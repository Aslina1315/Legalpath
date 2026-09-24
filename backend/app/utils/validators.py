"""
Input validation utilities.
Shared validation helpers for API request processing.
"""

import re
from typing import Any


MAX_NARRATIVE_LENGTH = 50_000
MIN_NARRATIVE_LENGTH = 10
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB (future: file uploads)

ALLOWED_UPLOAD_MIME_TYPES = frozenset({
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    # Future: additional document types
})


def validate_narrative(text: str) -> str:
    """
    Validate and sanitize narrative input.

    Args:
        text: Raw narrative text from the user.

    Returns:
        Stripped, validated narrative.

    Raises:
        ValueError: If the narrative fails validation.
    """
    stripped = text.strip()

    if len(stripped) < MIN_NARRATIVE_LENGTH:
        raise ValueError(
            f"Narrative must be at least {MIN_NARRATIVE_LENGTH} characters."
        )

    if len(stripped) > MAX_NARRATIVE_LENGTH:
        raise ValueError(
            f"Narrative exceeds maximum length of {MAX_NARRATIVE_LENGTH:,} characters."
        )

    # Basic check: reject null bytes
    if "\x00" in stripped:
        raise ValueError("Narrative contains invalid characters.")

    return stripped


def validate_upload_mime_type(mime_type: str) -> None:
    """
    Validate that an uploaded file's MIME type is allowed.
    FUTURE: Used when file upload endpoint is implemented.

    Raises:
        ValueError: If the MIME type is not allowed.
    """
    if mime_type not in ALLOWED_UPLOAD_MIME_TYPES:
        raise ValueError(
            f"File type '{mime_type}' is not supported. "
            f"Allowed types: {', '.join(sorted(ALLOWED_UPLOAD_MIME_TYPES))}"
        )


def validate_upload_size(size_bytes: int) -> None:
    """
    Validate that an uploaded file is within the size limit.
    FUTURE: Used when file upload endpoint is implemented.

    Raises:
        ValueError: If the file exceeds the size limit.
    """
    if size_bytes > MAX_UPLOAD_SIZE_BYTES:
        raise ValueError(
            f"File size ({size_bytes / 1024 / 1024:.1f} MB) exceeds "
            f"the {MAX_UPLOAD_SIZE_BYTES // 1024 // 1024} MB limit."
        )
