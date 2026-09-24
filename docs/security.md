# Security Model

> **Status**: Foundation implemented. See "PLANNED LATER" section for future controls.

---

## Principles

1. **No credentials in source code** — ever. All secrets via environment variables or Secret Manager.
2. **Defense in depth** — multiple layers, each independent.
3. **Least privilege** — services only access what they need.
4. **Fail securely** — errors return structured messages, never stack traces or sensitive data.
5. **No sensitive logging** — PII and secrets are never written to logs.

---

## Credential Isolation

### Frontend (Client)

Firebase web app configuration (`apiKey`, `authDomain`, etc.) is a **public identifier**, not a secret. It identifies your Firebase project — it does not grant access. Access control is enforced by:

- **Firebase App Check** — only attested clients (your app) can make API calls
- **Firestore Security Rules** — server-side access control
- **Firebase Auth** — user identity required for data access

These values are safe as `NEXT_PUBLIC_` environment variables.

The **Gemini API key** is **never in client code**. Firebase AI Logic exchanges an App Check token for a short-lived Gemini credential server-side. The client never sees the raw key.

### Backend (Server)

All secrets are environment variables. In production:
- Google Cloud Workload Identity (Cloud Run) — no service account JSON files
- Secret Manager for sensitive configuration (Stage 3)
- No `.env` files in production containers

---

## App Check Configuration

### Local Development

```
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=<debug token from Firebase Console>
```

**How to generate**:
1. Firebase Console → Build → App Check
2. Find your web app → Manage debug tokens
3. Generate a new token
4. Add to `frontend/.env.local` only

**Security properties**:
- Debug tokens are scoped to your Firebase project
- They are NOT equivalent to API keys
- They must NOT be committed to source control
- They must NOT appear in production environment variables

### Production

- reCAPTCHA Enterprise (to be configured in Stage 2)
- `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` must be absent from production env
- `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY` must be present

---

## Backend Security Controls (IMPLEMENTED NOW)

### CORS

```python
# Strict origin allowlist from environment variables
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Production: will be set to the exact frontend Cloud Run or Firebase Hosting URL.

### Request Size Limits

```python
# Default: 1 MB
MAX_REQUEST_SIZE_BYTES=1048576
```

The middleware rejects any request with `Content-Length` exceeding this limit before processing begins.

### Rate Limiting

```python
# Requests per minute per IP (slowapi)
RATE_LIMIT_PER_MINUTE=60
```

Exceeding the limit returns `429 Too Many Requests` with retry-after header.

### Input Validation

All narrative inputs are validated:
- Minimum length (prevents empty/trivial submissions)
- Maximum length (prevents oversized payloads)
- Null byte rejection (prevents certain injection patterns)
- Pydantic V2 strict validation on all request schemas

### Structured Error Responses

Errors never expose:
- Stack traces
- Internal file paths
- Database state
- Credentials or keys

All errors return: `{"status": "error", "code": "...", "message": "..."}`

### Secure Logging

`structlog` is configured to output JSON logs. Sensitive fields are never logged:
- No request bodies
- No auth tokens
- No user PII (narrative text, names)
- No credentials

---

## Firebase Security Rules (IMPLEMENTED — firestore.rules)

Firestore security rules are defined in `firestore.rules` and enforce:
1. **Default Deny**: All unmapped collections and wildcard paths are inaccessible (`allow read, write: if false;`).
2. **User Isolation**: Authenticated callers can only read (`get`, `list`) case documents where `resource.data.userId == request.auth.uid`.
3. **Verified Creation**: On create, `request.resource.data.userId` must match `request.auth.uid`.
4. **Immutable Ownership**: Updates require `isOwner(resource.data.userId)` and enforce `request.resource.data.userId == resource.data.userId` to forbid transferring cases between accounts.
5. **Restricted Deletion**: Only the document owner can delete their case.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }

    match /cases/{caseId} {
      allow get: if isOwner(resource.data.userId);
      allow list: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.caseId == caseId;
      allow update: if isOwner(resource.data.userId)
        && request.resource.data.userId == resource.data.userId;
      allow delete: if isOwner(resource.data.userId);
    }
  }
}
```

---

## File Upload Security (PLANNED — Stage 3)

When file uploads are implemented:
- MIME type allowlist (PDF, JPEG, PNG, WebP only)
- Maximum file size: 10 MB
- Files stored in Firebase Storage with user-scoped paths
- No direct URL exposure — access via signed URLs
- Virus scanning (Cloud Storage scan) — to be evaluated

---

## Authentication Security (PLANNED — Stage 2)

- Firebase Auth handles token issuance and refresh
- ID tokens verified server-side via Firebase Admin SDK
- Session management: Firebase short-lived tokens (1 hour) + refresh tokens
- Email verification required before case creation

---

## IMPLEMENTED NOW

- ✅ No credentials in source code
- ✅ Environment-variable-only configuration (.env.example, frontend/.env.local.example)
- ✅ App Check debug token workflow (local dev)
- ✅ Firestore Security Rules (firestore.rules)
- ✅ CORS middleware (configurable origins)
- ✅ Request size limit middleware (centralized in app.core.security)
- ✅ Rate limiting (slowapi)
- ✅ Structured error responses
- ✅ No-PII logging policy
- ✅ Input validation (narrative, schema validation)

## PLANNED LATER

- ⏳ Firebase Auth enforcement on backend API routes
- ⏳ Secret Manager integration
- ⏳ Workload Identity (Cloud Run)
- ⏳ File upload security controls
- ⏳ reCAPTCHA Enterprise (production App Check)
- ⏳ Security audit
