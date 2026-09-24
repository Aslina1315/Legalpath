# Testing Strategy

> **Status**: Foundation tests implemented. See "PLANNED LATER" for future test coverage.

---

## Test Philosophy

1. **Real tests only** — no tests that assert non-existent features work
2. **Tests run in CI** — every check is automated
3. **Fail loudly** — no swallowed errors or silent test passes
4. **Tests document intent** — test names describe the behaviour being verified

---

## Frontend Tests (Jest + Testing Library)

**Location**: `frontend/__tests__/`  
**Runner**: Jest with `jest-environment-jsdom`  
**Framework**: `@testing-library/react` + `@testing-library/jest-dom`

### Running Tests

```bash
cd frontend
npm test                        # Run once
npm test -- --watchAll=false    # CI mode
npm test -- --coverage          # With coverage report
```

### Test Files

| File | What It Tests |
|------|--------------|
| `firebase.test.ts` | Firebase module validation — missing env vars throw correctly |
| `intake.test.tsx` | IntakeForm renders, accessible label, submit button, validation |
| `ai-schemas.test.ts` | Zod schemas validate correct data, reject invalid data |

### Mocking Strategy

- Firebase modules are mocked in component tests to avoid real SDK initialisation
- Env vars are set in `beforeEach` and restored in `afterEach`
- No real network calls in any unit test

---

## Backend Tests (pytest)

**Location**: `backend/tests/`  
**Runner**: pytest  
**HTTP client**: `httpx` via FastAPI `TestClient`

### Running Tests

```bash
cd backend
uv run pytest tests/ -v         # Verbose output
uv run pytest tests/ -v --tb=short  # Short tracebacks
```

### Test Files

| File | What It Tests |
|------|--------------|
| `test_health.py` | GET /health returns 200, correct JSON, correct content-type |
| `test_schemas.py` | Case Pydantic schema validates/rejects data correctly |
| `test_validation.py` | 404 on missing routes, 405 on wrong methods |

---

## AI Evaluation Tests

**Location**: `tests/ai-evaluation/`  
**Status**: Documentation only — no automated runner yet

See `adversarial-cases.md` for the full test case library:

- Prompt injection (9 scenarios)
- Unsupported legal claims
- Invented citations / hallucination
- Jurisdiction mismatch
- Contradictory documents
- Incomplete facts
- Malformed uploads
- Unsafe wording
- Gemini failures and timeouts

---

## Test Coverage Targets (Future)

| Layer | Target |
|-------|--------|
| Frontend unit tests | 80%+ line coverage |
| Backend unit tests | 90%+ line coverage |
| AI modules (evaluation) | 100% adversarial case pass |

---

## IMPLEMENTED NOW

- ✅ Jest test runner configured
- ✅ `@testing-library/react` for component tests
- ✅ Firebase module tests
- ✅ IntakeForm accessibility tests
- ✅ Zod schema validation tests
- ✅ pytest backend tests (health, schemas, validation)
- ✅ AI evaluation adversarial case documentation

## PLANNED LATER

- ⏳ E2E tests (Playwright)
- ⏳ Integration tests (Firebase emulator)
- ⏳ Automated AI evaluation harness
- ⏳ Golden dataset for AI module regression testing
- ⏳ CI pipeline (GitHub Actions)
- ⏳ Coverage reporting
