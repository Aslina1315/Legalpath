# Deployment & Operations Guide — Trusted Legal Access Platform

> **Status**: Production build verified. Cloud deployment architecture prepared for Google Cloud Run (Backend) and Firebase Hosting (Frontend).

---

## 1. Required Google Cloud & Firebase Services

Before deploying to production, enable the following APIs in Google Cloud Console (`promptwars-legal-ai` or your target project):

| Service | Purpose | Console Command / URL |
|---------|---------|-----------------------|
| **Cloud Run** | Backend container execution (FastAPI) | `gcloud services enable run.googleapis.com` |
| **Artifact Registry** | Container image storage (Docker images) | `gcloud services enable artifactregistry.googleapis.com` |
| **Cloud Build** | Automated container builds and deployment | `gcloud services enable cloudbuild.googleapis.com` |
| **Secret Manager** | Confidential environment variables (CORS, backend keys) | `gcloud services enable secretmanager.googleapis.com` |
| **Firebase Auth** | Anonymous & email authentication | Firebase Console → Authentication |
| **Cloud Firestore** | Document persistence with security rules | Firebase Console → Firestore Database |
| **Firebase App Check** | reCAPTCHA Enterprise attestation for Gemini & Firestore | Firebase Console → App Check |
| **Firebase AI Logic** | Client-side Gemini 3.8 Flash orchestration | Firebase Console → Build → AI Logic |

---

## 2. Environment Variables Specification

### Frontend (`frontend/.env.local` / Hosting Environment)

| Variable | Required In | Purpose |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Dev & Prod | Firebase web client authentication |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dev & Prod | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Dev & Prod | Google Cloud / Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Dev & Prod | Firebase Storage bucket for case documents |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Dev & Prod | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Dev & Prod | Firebase web application identifier |
| `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` | **Dev ONLY** | Debug token for localhost App Check bypass |
| `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY` | **Prod ONLY** | reCAPTCHA Enterprise key for production attestation |
| `NEXT_PUBLIC_BACKEND_URL` | Dev & Prod | URL of FastAPI backend service |

> **Security Rule**: Never commit `.env.local` or any production secrets to Git.

### Backend (`backend/.env` / Cloud Run Env & Secrets)

| Variable | Required In | Purpose |
|----------|-------------|---------|
| `ENVIRONMENT` | Dev & Prod | `development` or `production` |
| `LOG_LEVEL` | Dev & Prod | `INFO` in production, `DEBUG` in development |
| `DEBUG` | Dev & Prod | `false` in production |
| `ALLOWED_ORIGINS` | Dev & Prod | Comma-separated list of allowed frontend domains |

---

## 3. Production App Check Configuration

Firebase App Check protects your Gemini AI Logic quotas and Firestore database from abuse by unauthorized clients:

1. **Production Attestation Provider**:
   - Register a **reCAPTCHA Enterprise** site key in Google Cloud Console.
   - Associate the site key in **Firebase Console → App Check → Apps → Web App**.
   - Provide `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY` in your production build environment.
   - **Do NOT** put debug tokens in production environments.

2. **Enforcement Mode**:
   - Start with App Check in **Monitoring Mode** to verify legitimate browser traffic.
   - Once traffic is validated, switch **Firebase AI Logic** and **Cloud Firestore** to **Enforce**.

---

## 4. Firestore Security Rules Deployment

The project includes strict owner-isolated security rules in `firestore.rules`.

### Deployment Command:
```bash
# Login to Firebase
firebase login

# Set active project
firebase use promptwars-legal-ai

# Deploy rules only
firebase deploy --only firestore:rules
```

### Verified Rules Policy:
- Default deny across all collections.
- Case documents in `/cases/{caseId}` can only be read, created, or updated by the matching `request.auth.uid`.
- `userId` is immutable on update (ownership transfer is strictly blocked).

---

## 5. Build Commands

### Frontend Production Build:
```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm run build
```

### Backend Test & Package:
```bash
cd backend
uv sync --dev
uv run pytest
```

### Backend Docker Container Build:
```bash
docker build -t gcr.io/promptwars-legal-ai/legal-ai-backend:latest -f backend/Dockerfile .
```

---

## 6. Runtime & Deployment Commands

### Deploy Backend to Google Cloud Run:
```bash
# Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/promptwars-legal-ai/legal-ai-backend backend

# Deploy container to Cloud Run
gcloud run deploy legal-ai-backend \
  --image gcr.io/promptwars-legal-ai/legal-ai-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production,DEBUG=false,LOG_LEVEL=INFO \
  --set-secrets ALLOWED_ORIGINS=legal-ai-allowed-origins:latest
```

### Deploy Frontend to Firebase Hosting:
```bash
cd frontend
firebase deploy --only hosting
```

---

## 7. Current Deployment Readiness

| Component | Status | Blocker / Requirement |
|-----------|--------|-----------------------|
| **Frontend Codebase** | ✅ READY | Production build passes; 16 test suites pass |
| **Backend Codebase** | ✅ READY | 14 pytest unit tests pass; security schemas validated |
| **Firestore Rules** | ✅ READY | Rules written; ready for `firebase deploy --only firestore:rules` |
| **Document Generator** | ✅ READY | Module 11 implemented with 4-category trust separation |
| **Before-Send Review** | ✅ READY | Module 12 pre-flight verification implemented (READY/NEEDS_REVIEW/BLOCKED) |
| **Human Help Bridge** | ✅ READY | Module 13 implemented with verified official legal aid resources |
| **Live Cloud Deployment** | ⏳ BLOCKED | Pending user's real project credentials in `frontend/.env.local` |
