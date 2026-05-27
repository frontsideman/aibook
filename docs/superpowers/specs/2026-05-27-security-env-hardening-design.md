# Security + Env Hardening Design (Pass A, Balanced)

Date: 2026-05-27
Status: Approved for spec write
Scope: Sub-project 1 from stability roadmap

## 1. Goal and Success Criteria

This pass hardens environment configuration behavior without changing development runtime semantics.

Success criteria:
1. Backend fails fast on startup when required environment variables are missing or malformed.
2. `.env.example` files exist for backend, frontend, and database package.
3. Existing development defaults and flows remain intact (no behavior hardening for prod profile in this pass).

## 2. Scope

In scope:
- `apps/backend`: startup env validation integrated with NestJS config initialization.
- `apps/backend`: unit tests for env validation behavior.
- `apps/backend/.env.example`
- `apps/frontend/.env.example`
- `packages/database/.env.example`

Out of scope:
- CI integration (`env:check`, pipeline wiring)
- Production-only credential policy hardening
- Mock auth behavior change
- Health endpoints

## 3. Architectural Approach

Recommended approach: centralized env schema validation in backend via `ConfigModule.forRoot({ validate })`.

Rationale:
- Single source of truth for backend environment contract.
- Deterministic fail-fast behavior before app starts listening.
- Easy to unit-test independently from module runtime.
- Minimal impact on existing code paths.

Rejected alternatives:
- Ad hoc checks in `main.ts`: faster initially, weaker structure and testability.
- External prestart script only: increases script coupling and hides validation from Nest bootstrap lifecycle.

## 4. Environment Contract

### 4.1 Backend (`apps/backend`)

Mandatory:
- `DATABASE_URL`

Optional (defaults preserved in this pass):
- `PORT`
- `REDIS_HOST`
- `REDIS_PORT`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `MOCK_AUTH`

Validation rules:
- `DATABASE_URL`: non-empty string
- `REDIS_PORT` (if provided): valid integer
- `MOCK_AUTH` (if provided): one of `true` or `false`

### 4.2 Frontend (`apps/frontend`)

Mandatory:
- none for local startup

Optional:
- `BACKEND_URL` (default remains `http://localhost:3001` in `next.config.mjs`)

### 4.3 Database package (`packages/database`)

Runtime mandatory contract:
- `DATABASE_URL` for real database access

Note:
- Existing dummy fallback URL in `createPrismaClient` remains for isolated scenarios/tests and is not treated as production contract.

## 5. Data and Error Flow

1. App bootstrap initializes global config module.
2. Backend env validator runs before module graph fully starts serving traffic.
3. If contract check fails:
- throw configuration error with explicit variable names and rule violations
- process exits before binding HTTP port
4. If contract check passes:
- app boots normally
- existing runtime defaults in storage/queue/auth paths remain unchanged in this pass

## 6. Test Strategy

Backend unit tests for env validation:
1. Passes with minimal valid input (`DATABASE_URL` present).
2. Fails when `DATABASE_URL` is missing.
3. Fails when `REDIS_PORT` is non-numeric.
4. Fails when `MOCK_AUTH` is not `true|false`.

Execution target:
- run focused Jest validation tests in backend package.
- full backend test suite run is optional but recommended after integration.

## 7. Delivery Artifacts

Code artifacts to produce in implementation phase:
- Backend env validator module/file and integration into config bootstrap.
- Backend env validator test file.
- `.env.example` files for backend/frontend/database.

Documentation artifacts:
- This spec.

## 8. Risks and Mitigations

Risk: Hidden dependency on previously implicit env values.
- Mitigation: keep only `DATABASE_URL` mandatory in this pass, preserve all existing defaults.

Risk: Test flakiness due to process-level env mutation.
- Mitigation: isolate env validator as pure function and test with explicit input objects.

## 9. Acceptance Checklist

- [ ] Backend startup fails fast when `DATABASE_URL` is absent.
- [ ] Backend startup reports clear env validation errors.
- [ ] `apps/backend/.env.example` created.
- [ ] `apps/frontend/.env.example` created.
- [ ] `packages/database/.env.example` created.
- [ ] Backend env validation unit tests added and passing.
- [ ] No change to existing dev fallback behavior outside validation gate.
