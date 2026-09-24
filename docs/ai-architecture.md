# AI Architecture — 13-Module Pipeline

> **Status**: Architecture documented. Modules 01–13 are PLANNED.  
> Only the system readiness test call (connectivity verification) is implemented in Stage 1.

---

## Philosophy

Every AI response in this system must be:
- **Grounded** — sourced, not invented
- **Verified** — cross-checked against real information
- **Safe** — never legally prescriptive without appropriate disclaimers
- **Transparent** — the user must understand what the AI did and why

---

## Pipeline Overview

```
User Narrative
    │
    ▼
01  INTAKE UNDERSTANDING
    │  Extract intent, key facts, emotional context
    ▼
02  CASE STRUCTURING
    │  Entities, timeline, structured facts
    ▼
03  LEGAL DOMAIN IDENTIFICATION
    │  Housing / employment / contract / family / etc.
    ▼
04  JURISDICTION REASONING
    │  Detect or ask for jurisdiction; select applicable law corpus
    ▼
05  LIVE SOURCE RETRIEVAL
    │  Ground AI responses in real legal sources (Grounding API / RAG)
    ▼
06  EVIDENCE ANALYSIS
    │  Assess submitted documents and evidence
    ▼
07  EVIDENCE GAP DETECTION
    │  Identify what evidence is missing and why it matters
    ▼
08  CONTRADICTION DETECTION
    │  Find conflicts between facts, documents, and sources
    ▼
09  AI RESPONSE VERIFICATION
    │  Self-check: Are claims grounded? Any invented citations?
    ▼
10  ACTION PLANNING
    │  Generate prioritised, realistic next steps
    ▼
11  DOCUMENT GENERATION
    │  Draft letters, forms, complaints as appropriate
    ▼
12  PRE-SEND REVIEW
    │  Review generated document before user sends it
    ▼
13  FOLLOW-UP INTELLIGENCE
    │  Track outcomes, suggest next steps, update case
    ▼
Living Case
```

---

## Module Specifications

### Module 01: Intake Understanding

**Input**: Raw narrative text  
**Output**: `CaseIntakeResult` (structured JSON)  
**Model**: `gemini-3.8-flash` (structured output mode)  
**Status**: PLANNED — Stage 2

Extracts:
- One-sentence summary
- Detected legal domains (array)
- Key facts (array of strings)
- Named entities with roles
- Urgency level assessment
- Clarification questions needed

Safety constraints:
- Must not make legal conclusions
- Must not suggest outcomes
- Must flag if narrative contains threats/self-harm language for appropriate signposting

---

### Module 02: Case Structuring

**Input**: `CaseIntakeResult` + narrative  
**Output**: `StructuredFact[]`, `CaseEntity[]`, `TimelineEvent[]`  
**Status**: PLANNED — Stage 2

Builds the structured case data model that all subsequent modules reference.

---

### Module 03: Legal Domain Identification

**Input**: Structured facts + entities  
**Output**: Legal domain classification with confidence scores  
**Status**: PLANNED — Stage 2

Domains include: housing, employment, consumer rights, family law, immigration, criminal (referral only), data protection, contract disputes, benefits/welfare, discrimination.

Note: Criminal matters above a severity threshold must be redirected to a qualified solicitor/attorney.

---

### Module 04: Jurisdiction Reasoning

**Input**: Narrative, entities, legal domain  
**Output**: Detected jurisdiction code + confidence, or clarification request  
**Status**: PLANNED — Stage 2

Uses geographic signals in the narrative (organisations, place names, law references) to detect jurisdiction. Falls back to asking the user if confidence is below threshold.

---

### Module 05: Live Source Retrieval

**Input**: Legal domain, jurisdiction, structured facts  
**Output**: `LegalSource[]` with relevance scores  
**Status**: PLANNED — Stage 3

Strategy options:
- Gemini grounding with Google Search
- Custom RAG pipeline against verified legal databases
- Gov.uk / official government publication scraping

Constraint: Every claim in the output that references law must have a traceable source.

---

### Module 06: Evidence Analysis

**Input**: Uploaded evidence (text, images, documents) + structured facts  
**Output**: Evidence assessment with relevance scores  
**Status**: PLANNED — Stage 3 (requires multimodal + file upload)

---

### Module 07: Evidence Gap Detection

**Input**: Evidence list, structured facts, legal domain  
**Output**: `EvidenceGap[]` — what's missing, severity, how to get it  
**Status**: PLANNED — Stage 3

---

### Module 08: Contradiction Detection

**Input**: All structured data (facts, evidence, timeline, sources)  
**Output**: `Contradiction[]` — conflicts identified with references  
**Status**: PLANNED — Stage 3

---

### Module 09: AI Response Verification

**Input**: AI-generated analysis  
**Output**: Verification records — claims checked, confidence scores  
**Status**: PLANNED — Stage 3

This module prevents hallucinated citations and unfounded legal conclusions. It is mandatory before any AI-generated content is shown to the user.

---

### Module 10: Action Planning

**Input**: Verified analysis, jurisdiction, urgency level  
**Output**: `ActionItem[]` — prioritised, time-bounded steps  
**Status**: PLANNED — Stage 3

Steps must be:
- Achievable by a layperson
- Referenced to real resources (court forms, government portals, etc.)
- Ordered by urgency and dependency

---

### Module 11: Document Generation

**Input**: Action plan + case data + jurisdiction  
**Output**: Draft documents (letters, formal complaints, claims)  
**Status**: PLANNED — Stage 4

All generated documents must carry a disclaimer and be presented as drafts requiring human review.

---

### Module 12: Pre-Send Review

**Input**: Draft document  
**Output**: Review feedback — tone, completeness, accuracy flags  
**Status**: PLANNED — Stage 4

---

### Module 13: Follow-Up Intelligence

**Input**: Case history + user updates  
**Output**: Updated action plan, new questions, case progression suggestions  
**Status**: PLANNED — Stage 4

---

## Safety Architecture

### What the AI Must Never Do

- State a legal conclusion as certain ("You will win")
- Invent citations (legislation, case law) without grounded sources
- Provide specific legal advice beyond informational assistance
- Suggest a definitive outcome in criminal matters
- Withhold urgent referral signals (domestic violence, housing emergency, imminent court date)

### Verification Chain

Every substantive AI output passes through Module 09 (AI Response Verification) before display. This includes:
- Citation grounding check
- Logical consistency check
- Jurisdiction validity check
- Safety flag check

### Wording Constraints

All AI-generated text must use epistemic hedges:
- "This may apply to your situation..."
- "Based on the information you've shared..."
- "You might want to consider..."
- Never: "You should...", "You must...", "You will..."

---

## IMPLEMENTED NOW (Stage 1)

- `lib/ai/aiClient.ts` — Firebase AI Logic client
- `lib/ai/models.ts` — Model configuration registry
- `lib/ai/prompts.ts` — Prompt registry (readiness check only)
- `lib/ai/schemas.ts` — Typed schemas (SystemReadiness + CaseIntake placeholder)
- `lib/ai/streamingHelper.ts` — Stream wrapper (ready, not wired)
- `lib/ai/structuredOutputHelper.ts` — JSON mode wrapper (ready, not wired)
- `lib/ai/multimodalHelper.ts` — Multimodal parts builder (ready, not wired)
- `lib/ai/systemReadiness.ts` — Real Gemini connectivity test

## PLANNED (Stages 2–4)

All 13 AI pipeline modules listed above.
