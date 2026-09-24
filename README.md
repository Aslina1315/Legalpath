# PromptWars — Trusted Legal Access Platform

> **Working name**: LegalPath (temporary — change in [`frontend/src/tokens/design.ts`](frontend/src/tokens/design.ts))
> **Status**: Foundation build — vertical slice 1 in progress

---

## What This Is

An AI-assisted legal access platform built for the PromptWars challenge.

**Philosophy**: *Tell us what happened. Understand what matters. Know what to do next.*

The application guides users through one continuous intelligent journey — not a collection of disconnected feature tabs. Every visible feature connects to real application logic, Gemini AI, Firebase, and Google services.

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.11+ |
| uv | latest |

Install `uv` (Python package manager):
```bash
# Windows
winget install --id=astral-sh.uv -e
# or
pip install uv
```

---

### 1. Configure Environment Variables

```bash
# Frontend
cp .env.example frontend/.env.local
# Edit frontend/.env.local with your Firebase config values

# Backend
cp .env.example backend/.env
# Edit backend/.env with your service configuration
```

See [`.env.example`](.env.example) for all required variables and where to get them.

> **Firebase App Check (local dev)**: Generate a debug token in Firebase Console → Build → App Check → your web app → Manage debug tokens. Add it as `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` in `frontend/.env.local`.

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

**Other commands:**
```bash
npm run typecheck   # TypeScript check
npm run lint        # ESLint
npm run build       # Production build
npm test            # Jest unit tests
```

---

### 3. Backend

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API available at [http://localhost:8000](http://localhost:8000)  
Health check: [http://localhost:8000/health](http://localhost:8000/health)  
OpenAPI docs (dev only): [http://localhost:8000/docs](http://localhost:8000/docs)

**Run tests:**
```bash
uv run pytest tests/ -v
```

---

## Project Structure

```
/
├── frontend/                 # Next.js 14 App Router (TypeScript)
│   ├── src/
│   │   ├── app/              # Next.js App Router pages & layouts
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # Design system primitives
│   │   │   ├── intake/       # Intake workflow components
│   │   │   ├── layout/       # Shell, nav
│   │   │   └── providers/    # Firebase, Auth providers
│   │   ├── lib/
│   │   │   ├── firebase/     # Firebase initialization & App Check
│   │   │   └── ai/           # Firebase AI Logic helpers
│   │   ├── store/            # Zustand state management
│   │   ├── tokens/           # Design tokens (brand name lives here)
│   │   └── types/            # TypeScript types (Case, AI states)
│   └── __tests__/            # Jest unit tests
│
├── backend/                  # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   ├── core/             # Security, logging
│   │   ├── schemas/          # Pydantic models
│   │   ├── services/         # Business logic (stubs)
│   │   ├── integrations/     # Firebase Admin, Gemini (stubs)
│   │   └── utils/            # Validators
│   └── tests/                # pytest
│
├── shared/                   # Language-agnostic schemas & constants
├── tests/
│   └── ai-evaluation/        # Adversarial AI test documentation
├── docs/                     # Architecture & deployment docs
├── scripts/                  # Dev setup scripts
├── .env.example              # Environment variable reference
├── .gitignore
└── README.md
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript (strict), Tailwind CSS |
| State | Zustand |
| Validation | Zod |
| Firebase | Authentication, Firestore, AI Logic, App Check |
| AI | Firebase AI Logic → Gemini Developer API |
| Backend | FastAPI, Pydantic v2, uvicorn |
| Python tooling | uv, ruff, pytest |
| Cloud target | Google Cloud Run |

---

## Environment Variables

See [`.env.example`](.env.example) — all variables documented with source instructions.

**Frontend** (prefix `NEXT_PUBLIC_`):
- Firebase web app config (6 vars)
- `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` — local development App Check
- `NEXT_PUBLIC_BACKEND_URL` — backend service URL

**Backend**:
- `ENVIRONMENT`, `LOG_LEVEL`, `DEBUG`
- `ALLOWED_ORIGINS` — CORS origins
- `MAX_REQUEST_SIZE_BYTES`, `RATE_LIMIT_PER_MINUTE`

---

## Security Principles

- No credentials in source code
- All Firebase config via `NEXT_PUBLIC_` environment variables
- Gemini API key managed by Firebase (never in client code)
- App Check enforces authorized clients
- Backend: CORS restricted to configured origins, request size limits, rate limiting
- Structured logging with no sensitive field output
- See [`docs/security.md`](docs/security.md)

---

## What's Built Now

### Stage 1 — Foundation ✅
- [x] Landing shell with "Tell us what happened" intake form
- [x] Firebase client initialization (Auth, Firestore, App Check)
- [x] Firebase AI Logic + Gemini integration architecture
- [x] AI state machine types (`IDLE → UNDERSTANDING → READY → ERROR`)
- [x] Case data model (TypeScript + Python/Pydantic)
- [x] FastAPI backend with health endpoint, CORS, rate limiting, structured logging
- [x] Design token system (colors, typography, spacing, animation)
- [x] Accessibility foundation (semantic HTML, focus states, reduced-motion)
- [x] Unit tests (frontend: Jest, backend: pytest)

### Stage 2 — AI Intake + Auth ✅
- [x] **AI Module 01: Intake Understanding** — real Gemini structured-output call via `firebase/ai`
- [x] **CaseResultCard** — renders extracted summary, legal domains, key facts, entities, urgency, clarification questions
- [x] **Google Sign-In** (popup) + **Email/Password** auth flow
- [x] **AuthModal** — full accessible dialog with mode toggle (sign-in / sign-up)
- [x] **TopNav** — auth-aware: sign-in button → user avatar → sign-out dropdown
- [x] **Firestore case creation** helper — `createCase()` with server timestamp
- [x] Firebase auth helpers with user-friendly error messages

### Stage 3 — Full AI Pipeline + Save + Case View ✅
- [x] **AI Module 02: Case Structuring** — deeper Gemini call: timeline, entity map, structured facts, evidence gap list
- [x] **CaseStructureCard** — renders timeline with confidence bars, entity roles, structured facts, evidence available/missing
- [x] **Two-module pipeline** — Module 01 displays instantly; Module 02 runs in the background; both results shown on completion
- [x] **SaveCasePrompt** — auto-saves to Firestore (signed-in users) or shows sign-in nudge; navigates to case page after save
- [x] **`/case/[caseId]`** — protected route showing the full saved case from Firestore (owner-only access)
- [x] `useCaseStore` extended with `caseId` tracking
- [x] **28/28 tests passing** (5 suites), TypeScript strict — zero errors

## What's Planned Next

- [ ] AI Module 03: Legal Domain + Jurisdiction Reasoning (with Gemini grounding)
- [ ] Action Plan view — prioritised next steps for the user
- [ ] Voice input (Web Speech API / Google STT)
- [ ] Multi-language support
- [ ] Firestore security rules deployment

See [`docs/ai-architecture.md`](docs/ai-architecture.md) for the full 13-module AI pipeline plan.

---

## Branding

The name **LegalPath** is a temporary placeholder. To rebrand:
1. Open [`frontend/src/tokens/design.ts`](frontend/src/tokens/design.ts)
2. Update `BRAND.name` and `BRAND.tagline`
3. That's it — everything else reads from this single file

---

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/architecture.md`](docs/architecture.md) | System architecture |
| [`docs/ai-architecture.md`](docs/ai-architecture.md) | 13 AI pipeline modules |
| [`docs/security.md`](docs/security.md) | Security model |
| [`docs/testing.md`](docs/testing.md) | Test strategy |
| [`docs/accessibility.md`](docs/accessibility.md) | Accessibility approach |
| [`docs/deployment.md`](docs/deployment.md) | Cloud Run deployment guide |
