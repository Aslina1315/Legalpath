"""
Case document schema — Python/Pydantic mirror of the TypeScript Case interface.
Future: will be used for Firestore document validation and API request/response.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CaseStatus(str, Enum):
    DRAFT = "DRAFT"
    INTAKE = "INTAKE"
    ANALYZING = "ANALYZING"
    STRUCTURED = "STRUCTURED"
    ACTION_READY = "ACTION_READY"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


class EntityRole(str, Enum):
    CLAIMANT = "CLAIMANT"
    RESPONDENT = "RESPONDENT"
    WITNESS = "WITNESS"
    THIRD_PARTY = "THIRD_PARTY"
    INSTITUTION = "INSTITUTION"
    OTHER = "OTHER"


class EvidenceStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    MISSING = "MISSING"
    PARTIAL = "PARTIAL"


class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class UrgencyLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNKNOWN = "UNKNOWN"


class CaseTimestamps(BaseModel):
    model_config = ConfigDict(frozen=True)

    created_at: str
    updated_at: str
    intake_completed_at: str | None = None
    analysis_completed_at: str | None = None
    closed_at: str | None = None


class StructuredFact(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    source_narrative_offset: int | None = None


class CaseEntity(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    name: str = Field(min_length=1, max_length=500)
    role: EntityRole
    notes: str | None = None


class TimelineEvent(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    date: str | None = None
    approximate_date: str | None = None
    description: str
    confidence: float = Field(ge=0.0, le=1.0)


class Evidence(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    type: str
    description: str
    status: EvidenceStatus
    storage_ref: str | None = None


class EvidenceGap(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    description: str
    severity: Severity
    suggestion: str | None = None


class Contradiction(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    description: str
    item_a_ref: str
    item_b_ref: str
    severity: Severity


class LegalSource(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    title: str
    url: str | None = None
    jurisdiction: str | None = None
    relevance_score: float | None = Field(default=None, ge=0.0, le=1.0)
    retrieved_at: str


class ActionItem(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    priority: str
    title: str
    description: str
    deadline: str | None = None
    completed: bool = False


class Case(BaseModel):
    """Root case document — mirrors future Firestore document structure."""

    model_config = ConfigDict(frozen=True)

    case_id: str
    user_id: str
    jurisdiction: str | None = None
    narrative: str = Field(min_length=1, max_length=50_000)
    status: CaseStatus
    timestamps: CaseTimestamps

    # Populated by AI pipeline stages
    structured_facts: list[StructuredFact] | None = None
    entities: list[CaseEntity] | None = None
    timeline: list[TimelineEvent] | None = None
    evidence: list[Evidence] | None = None
    gaps: list[EvidenceGap] | None = None
    contradictions: list[Contradiction] | None = None
    sources: list[LegalSource] | None = None
    action_plan: list[ActionItem] | None = None

    # Metadata
    language: str | None = None
    ai_pipeline_version: str | None = None

    @field_validator("narrative")
    @classmethod
    def narrative_not_whitespace_only(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Narrative cannot be empty or whitespace only")
        return v
