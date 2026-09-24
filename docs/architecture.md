# System Architecture

> **Status**: Foundation build (Stage 1)
> **Last updated**: 2026-09-22

---

## Overview

The Trusted Legal Access Platform is a full-stack AI-assisted legal access system built on Google Cloud and Firebase. It guides users through one continuous intelligent journey from narrative intake to actionable next steps.

```
Browser (Next.js)
    │
    ├── Firebase Auth          (identity)
    ├── Firestore              (case storage)
    ├── Firebase App Check     (client attestation)
    └── Firebase AI Logic      (Gemini — client-side AI)
            │
            └── Gemini Developer API
                    │
                    └── Gemini 3.8 Flash (default)

Python Backend (FastAPI → Cloud Run)
    │
    ├── Firebase Admin SDK     (Firestore, Auth verification)
    ├── Google Cloud APIs      (future: STT, Document AI)
    └── Secret Manager         (future: server credentials)
```

---

## Frontend Architecture

**Framework**: Next.js 14 App Router  
**Language**: TypeScript (strict mode)  
**Styling**: Tailwind CSS + CSS custom properties  
**State**: Zustand (lightweight, TypeScript-first)  
**Validation**: Zod (runtime schema validation)

### Layer Structure

```
src/
├── app/                   Next.js App Router pages
│   └── layout.tsx         Root layout — providers, fonts, meta
│
├── components/
│   ├── ui/                Primitive design system components
│   │   ├── Button.tsx
│   │   ├── Textarea.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── VisuallyHidden.tsx
│   ├── intake/            Intake workflow components
│   │   ├── IntakeForm.tsx
│   │   └── AIStateIndicator.tsx
│   ├── layout/            AppShell, TopNav
│   └── providers/         FirebaseProvider, AuthProvider
│
├── lib/
│   ├── firebase/          Firebase initialization
│   │   ├── firebase.ts    App, Auth, Firestore
│   │   └── appCheck.ts    App Check (debug + production)
│   └── ai/                Firebase AI Logic
│       ├── aiClient.ts    getAI() instance
│       ├── models.ts      Model config registry
│       ├── prompts.ts     Prompt registry
│       ├── schemas.ts     Zod + Firebase AI schemas
│       ├── streamingHelper.ts
│       ├── structuredOutputHelper.ts
│       ├── multimodalHelper.ts
│       └── systemReadiness.ts
│
├── store/
│   ├── useAppStore.ts     Auth + AI state
│   └── useCaseStore.ts    Case draft state
│
├── tokens/
│   └── design.ts          Brand name + all design tokens (ONE FILE)
│
└── types/
    ├── ai.ts              AIProcessingState enum + interfaces
    └── case.ts            Case model interfaces
```

### AI State Machine

The AI processing state drives both UI rendering and future animation:

```
IDLE → UNDERSTANDING → RESEARCHING → ANALYZING → COMPARING → VERIFYING → READY
                                                                         ↓
                                                                       ERROR
```

States map to REAL backend/AI events — not timers.

---

## Backend Architecture

**Framework**: FastAPI  
**Language**: Python 3.11+  
**Validation**: Pydantic v2  
**Logging**: structlog (JSON-structured)  
**Rate limiting**: slowapi  
**Package manager**: uv  
**Deployment target**: Google Cloud Run

```
app/
├── main.py          App factory, middleware, startup
├── config.py        BaseSettings — all config from env vars
├── api/
│   ├── health.py    GET /health
│   └── router.py    Central router
├── core/
│   ├── logging.py   structlog configuration
│   └── security.py  CORS, size limits
├── schemas/
│   ├── base.py      ErrorResponse, SuccessResponse, HealthResponse
│   └── case.py      Pydantic Case model (mirrors TypeScript)
├── services/        Business logic (future AI pipeline)
├── integrations/    Firebase Admin, Gemini (stubs)
└── utils/
    └── validators.py Input validation helpers
```

---

## Data Flow (Current — Stage 1)

```
User types narrative
    ↓
IntakeForm (React)
    ↓
Zustand: setAIState('UNDERSTANDING')
    ↓
AIStateIndicator renders
    ↓
[Stage 2: Firebase AI Logic → Gemini]
    ↓
[Stage 2: Firestore case document created]
```

---

## Firestore Schema (Planned — Stage 2)

```
/cases/{caseId}           (main case document)
/cases/{caseId}/events/   (audit log — future)
/users/{userId}           (user profile — future)
```

No Firestore collections have been created yet. Schema is fully typed in:
- TypeScript: `src/types/case.ts`
- Python: `app/schemas/case.py`
- JSON Schema: `shared/schemas/case.json`

---

## IMPLEMENTED NOW

- Next.js app shell with intake form
- Firebase initialization (Auth, Firestore, App Check)
- Firebase AI Logic architecture (client, models, schemas, helpers)
- Zustand state management
- FastAPI backend with health endpoint
- CORS, rate limiting, request size limits
- Structured logging
- Design token system
- Case type system (TypeScript + Python + JSON Schema)
- Unit tests (frontend Jest, backend pytest)

## PLANNED LATER

- Firestore collection creation and real-time sync
- Google Sign-In and Email/Password auth flow
- All 13 AI pipeline modules
- Voice input
- Multi-language support
- File upload and evidence analysis
- Document generation
- Cloud Run deployment configuration
- Secret Manager integration
