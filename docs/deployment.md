# Deployment Guide

> **Status**: Local development setup is complete. Cloud deployment is PLANNED for Stage 2.

---

## Current: Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
# → http://localhost:8000/health
# → http://localhost:8000/docs (OpenAPI UI, dev only)
```

---

## Target: Google Cloud Run

Both services are designed for Cloud Run deployment.

### Why Cloud Run

- Serverless, scales to zero
- Managed HTTPS + custom domains
- Workload Identity Federation (no service account key files)
- Private service-to-service communication
- Integrated with Firebase and Secret Manager

---

## Frontend Deployment (PLANNED — Stage 2)

### Option A: Firebase App Hosting (Recommended)

Firebase App Hosting natively supports Next.js App Router with:
- Server-side rendering (SSR)
- API routes
- Automatic CDN
- Firebase integration

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Deploy
firebase deploy --only hosting
```

### Option B: Cloud Run (Next.js containerized)

```dockerfile
# Dockerfile (PLANNED — Stage 2)
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Backend Deployment (PLANNED — Stage 2)

### Dockerfile

```dockerfile
# Dockerfile (PLANNED — Stage 2)
FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies
COPY backend/pyproject.toml .
RUN uv sync --no-dev --frozen

# Copy application
COPY backend/app ./app

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Run Configuration

```yaml
# cloudrun.yaml (PLANNED — Stage 2)
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: legal-ai-backend
  annotations:
    run.googleapis.com/ingress: internal-and-cloud-load-balancing
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
    spec:
      serviceAccountName: legal-ai-backend@promptwars-legal-ai.iam.gserviceaccount.com
      containers:
        - image: gcr.io/promptwars-legal-ai/legal-ai-backend
          ports:
            - containerPort: 8000
          env:
            - name: ENVIRONMENT
              value: production
            - name: ALLOWED_ORIGINS
              valueFrom:
                secretKeyRef:
                  name: allowed-origins
                  key: latest
```

---

## Secret Manager (PLANNED — Stage 3)

In production, sensitive configuration will be stored in Secret Manager and accessed via:
- Workload Identity Federation (Cloud Run)
- Secret Manager SDK calls in application startup

No service account JSON files in production containers.

---

## Environment Variables in Cloud Run

| Variable | Source |
|----------|--------|
| `ENVIRONMENT` | Cloud Run environment variable |
| `ALLOWED_ORIGINS` | Secret Manager |
| `GOOGLE_CLOUD_PROJECT` | Cloud Run metadata |
| Firebase Admin credentials | Workload Identity (no key needed) |

---

## Google Cloud Project

**Project ID**: `promptwars-legal-ai`

Services to enable (when deploying):
- Cloud Run
- Secret Manager
- Cloud Build (for CI/CD)
- Artifact Registry (container images)
- Firebase (already configured)

---

## IMPLEMENTED NOW

- ✅ Local development workflow documented
- ✅ Next.js production build configuration
- ✅ FastAPI production-ready (no debug mode, hidden docs in non-dev environments)
- ✅ Environment-variable-driven configuration (ready for Cloud Run injection)

## PLANNED LATER

- ⏳ Dockerfiles (frontend + backend)
- ⏳ Cloud Run deployment YAML
- ⏳ GitHub Actions CI/CD pipeline
- ⏳ Firebase App Hosting configuration
- ⏳ Secret Manager integration
- ⏳ Workload Identity setup
- ⏳ Custom domain and SSL
- ⏳ Load testing before launch
