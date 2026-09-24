"""
Case schema validation tests.
Verifies that the Pydantic schema correctly validates and rejects data.
"""

import pytest
from pydantic import ValidationError

from app.schemas.case import Case, CaseStatus, CaseTimestamps, EntityRole, CaseEntity


def make_valid_timestamps() -> dict[str, str]:
    return {
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }


def make_valid_case(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "case_id": "case-123",
        "user_id": "user-456",
        "narrative": "I was evicted without proper notice from my apartment.",
        "status": "DRAFT",
        "timestamps": make_valid_timestamps(),
    }
    base.update(overrides)
    return base


class TestCaseSchemaValidation:
    def test_valid_minimal_case(self) -> None:
        """A minimal valid case passes validation."""
        case = Case(**make_valid_case())  # type: ignore[arg-type]
        assert case.case_id == "case-123"
        assert case.status == CaseStatus.DRAFT

    def test_valid_case_with_all_optional_fields(self) -> None:
        """A case with all optional fields passes validation."""
        data = make_valid_case(
            jurisdiction="England and Wales",
            language="en",
            entities=[
                {"id": "e1", "name": "Landlord Corp", "role": "RESPONDENT"}
            ],
        )
        case = Case(**data)  # type: ignore[arg-type]
        assert case.entities is not None
        assert len(case.entities) == 1
        assert case.entities[0].role == EntityRole.RESPONDENT

    def test_rejects_missing_required_field(self) -> None:
        """Missing case_id raises ValidationError."""
        data = make_valid_case()
        del data["case_id"]
        with pytest.raises(ValidationError):
            Case(**data)  # type: ignore[arg-type]

    def test_rejects_empty_narrative(self) -> None:
        """Empty narrative raises ValidationError."""
        data = make_valid_case(narrative="")
        with pytest.raises(ValidationError):
            Case(**data)  # type: ignore[arg-type]

    def test_rejects_whitespace_only_narrative(self) -> None:
        """Whitespace-only narrative raises ValidationError."""
        data = make_valid_case(narrative="   \n  ")
        with pytest.raises(ValidationError):
            Case(**data)  # type: ignore[arg-type]

    def test_rejects_invalid_status(self) -> None:
        """Invalid status enum value raises ValidationError."""
        data = make_valid_case(status="INVALID_STATUS")
        with pytest.raises(ValidationError):
            Case(**data)  # type: ignore[arg-type]

    def test_rejects_invalid_entity_role(self) -> None:
        """Invalid entity role raises ValidationError."""
        data = make_valid_case(
            entities=[{"id": "e1", "name": "Someone", "role": "VILLAIN"}]
        )
        with pytest.raises(ValidationError):
            Case(**data)  # type: ignore[arg-type]

    def test_structured_fact_confidence_range(self) -> None:
        """Confidence outside 0-1 range raises ValidationError."""
        data = make_valid_case(
            structured_facts=[{
                "id": "f1",
                "text": "Eviction notice not given.",
                "confidence": 1.5,  # Invalid: > 1.0
            }]
        )
        with pytest.raises(ValidationError):
            Case(**data)  # type: ignore[arg-type]
