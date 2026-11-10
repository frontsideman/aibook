# Analytics: Stability Hardening (November 2026)

**Date:** 2026-11-11
**Type:** Infrastructure / Stability
**Author:** Code review pass

## Summary

Hardened ownership checks, request validation, generation atomicity, PDF delivery, and
the Docker development stack. Updated Next.js, Prisma, oxfmt, and undici within
compatible ranges; removed the unused MSW dependency from the frontend.

## Version Changes

| Component | Before | After |
|-----------|--------|-------|
| Next.js | 16.2.9 | 16.4.6 |
| Prisma / @prisma/client | 7.8.0 | 7.10.1 |
| oxfmt | 0.53.0 | 0.78.0 |
| undici | 8.4.1 | 8.12.4 |
| class-validator / class-transformer | — | 0.15.1 / 0.5.1 |
| msw | 2.14.6 | removed |

## Test Coverage

| Workspace | Before | After |
|-----------|--------|-------|
| Backend (Jest) | 93 tests | 134 tests |
| Frontend (Vitest) | 83 tests | 86 tests |
| Playwright | 1 shell smoke test | 1 stubbed-API form smoke test |

## CI/CD Results

| Check | Status |
|-------|--------|
| `npm run lint` | Pass, 0 warnings |
| `npm run format:check` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass |
| `npm run test` | Pass (220 tests total) |
| `npm run test:e2e` | Pass when ports are free |
| `npm audit --audit-level=critical` | Pass |

## Security

| Metric | Before | After |
|--------|--------|-------|
| Critical advisories | 5 | 0 |
| High advisories | 26 | 8 |
| Total advisories | 64 | 34 |

Remaining high/moderate findings are largely transitive tooling dependencies
(NestJS 10 CLI, Prisma CLI, Jest) and require major upgrades.

## Functional Fixes

- Child-profile reads/writes/deletes are user-scoped (IDOR fix).
- Book reads/writes require ownership; child ownership is checked at creation.
- Global `ValidationPipe` and DTO decorators reject malformed requests with `400`.
- Approval and regeneration use atomic status transitions; wrong-status operations
  return `409`.
- Regeneration no longer deletes pages before enqueue; the worker replaces pages in
  one transaction.
- Deleting a child profile keeps books (`Book.childId = NULL`).
- PDF download for completed books creates the file on first click and stores it in
  MinIO.
- Generating-page retry resumes polling or calls the regenerate endpoint correctly.
- Preview page combines page notes with global feedback so notes are not lost.
- Dashboard sorting is applied server-side and status counts are library-wide.
- Added `/health`, `/notifications`, and `/forgot-password`; removed dead links.
- Docker images run as the non-root `node` user; Docker smoke tests poll `/health`.
- MinIO and a bucket initializer were added to both Compose files.

## Notes

- The current E2E test stubs `/api/*`; expanding it to real generation requires a
  stubbed LLM provider and database orchestration.
- `npm audit --audit-level=high` is still failing; the CI gate remains at `critical`.
