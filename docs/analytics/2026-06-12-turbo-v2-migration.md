# Analytics: Turborepo v1 → v2 Migration

**Date:** 2026-06-12
**Type:** Infrastructure
**Author:** AI Agent + Aliaksandr

## Summary

Migrated Turborepo from 1.10.15 to 2.9.18. Major version upgrade with breaking changes handled by official codemod. All CI/CD checks passed, zero critical vulnerabilities.

## Version Changes

| Component | Before | After |
|-----------|--------|-------|
| Turborepo | ^1.10.15 | ^2.9.18 |
| turbo.json schema | `turbo.build/schema.json` | `v2-9-18.turborepo.dev/schema.json` |
| Config key | `pipeline` | `tasks` |
| packageManager | not set | `npm@11.6.2` |

## Performance Metrics

| Metric | Value |
|--------|-------|
| Build (FULL TURBO cache) | 34–52ms |
| Packages in scope | 3 |
| Cache hit rate | 100% |
| Remote caching | disabled |

## Bundle Size

Not applicable — build tooling change only, no application code changes.

## Test Coverage

| Workspace | Tests | Status |
|-----------|-------|--------|
| apps/frontend | 83 | ✓ all pass |
| apps/backend | 93 | ✓ all pass |
| **Total** | **176** | **✓** |

## Dependencies

| Metric | Before | After |
|--------|--------|-------|
| Total packages | ~1465 | ~1465 |
| turbo | 1.10.15 | 2.9.18 |
| Lock file changes | — | 236 lines |

## Files Changed

| File | Change |
|------|--------|
| `turbo.json` | Schema URL updated, `pipeline` → `tasks` |
| `package.json` | turbo ^1.10.15 → ^2.9.18, added `packageManager` |
| `commitlint.config.js` | Added for PR checks |
| `package-lock.json` | 236 lines (dependency updates) |

## CI/CD Results

| Check | Workflow | Status |
|-------|----------|--------|
| Lint & Format | ci.yml | ✓ |
| Typecheck | ci.yml | ✓ |
| Test Backend | ci.yml | ✓ |
| Test Frontend | ci.yml | ✓ |
| E2E Tests | ci.yml | ✓ |
| Build | ci.yml | ✓ |
| Security Audit | ci.yml | ✓ |
| Dependency Check | ci.yml | ✓ |
| Commitlint | pr-checks.yml | ✓ |
| PR Size Check | pr-checks.yml | ✓ |
| PR Labels Check | pr-checks.yml | ✓ |
| Docker Test | docker-test.yml | ✓ |

## Security

| Metric | Value |
|--------|-------|
| Critical vulnerabilities | 0 |
| High vulnerabilities | 6 |
| Moderate vulnerabilities | 17 |
| Low vulnerabilities | 3 |

High/moderate vulnerabilities are from upstream dependencies (NestJS, multer, glob, webpack) — not introduced by this migration.

## Benefits

- **Rust-based core** — rewritten from Go to Rust for better performance and reliability
- **Improved cache safety** — warnings for incorrect cache configurations
- **Better error messages** — clear diagnostics for misconfigurations
- **Strict `--filter`** — exact workspace name matching prevents bugs
- **Schema validation** — turbo.json automatically validated
- **Automatic codemods** — `npx @turbo/codemod migrate` handles version upgrades
- **`engines` in hash** — Node version changes invalidate cache correctly

## Notes

- Migration performed on feature branch `feat/turbo-v2-migration`
- PR #1 merged to main
- Remote caching not configured (no TURBO_TOKEN/TURBO_TEAM secrets)
- Dockerfiles use `--filter=frontend` and `--filter=backend...` — both work correctly in v2
