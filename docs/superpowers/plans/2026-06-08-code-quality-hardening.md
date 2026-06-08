# Plan: Code Quality Hardening — Fix All 15 Issues

## Group A — Critical Path Bugs (blocking core flow)

### #1 Middleware hardcodes `hasProfiles = false`
**File:** `middleware.ts`
**Fix:** Fetch profiles via API in server-side logic instead of hardcoding `false`.
**Risk:** Adding an API call to middleware may affect latency, but profiles are small and cached.

### #2 Client/server filter mismatch breaks pagination
**Files:** `dashboard/page.tsx` + `book.service.ts`
**Fix:** Move `type` and `profile` filters to backend `findAll` query. Remove client-side `applyDashboardBookFilterSort`.
**Risk:** Backward-compatible — server already receives params, just needs to use them.

## Group B — Data Loss / Silent Failures

### #3 Brittle LLM page parsing regex
**File:** `book.processor.ts`
**Fix:** Support `Page 1:`, `**Page 1:**`, `Page 1.` formats. Add validation: if only 1 page extracted, log warning. Fall back to splitting by double newline.
**Risk:** May still fail on unexpected formats, but at least reports instead of silently doing nothing.

### #4 Settings PATCH silently ignores `llmModel`
**Files:** `settings.controller.ts` → `settings.service.ts`
**Fix:** Persist `llmModel` alongside `reasoningEffort` in `updateGenerationSettings()`.
**Risk:** None — currently the field is accepted but silently dropped, so adding persistence is strictly an improvement.

### #12 Generating page polls forever on FAILED
**File:** `generating/page.tsx`
**Fix:** Add max retries (e.g., 60 attempts = 2 minutes). After limit, show "FAILED" state with retry/back buttons.
**Risk:** Low.

## Group C — Code Quality & Consistency

### #5 BullMQ bypasses env validation
**File:** `app.module.ts`
**Fix:** Inject `ConfigService` to read `REDIS_HOST` and `REDIS_PORT` instead of `process.env`.
**Risk:** Low — `ConfigModule.forRoot({ isGlobal: true })` ensures config is available.

### #7 PDF stream never finalized on error
**File:** `pdf.service.ts`
**Fix:** Move stream-end logic to `finally` block so `doc.end()` always runs.
**Risk:** Low.

### #10 PrismaService typed as any
**File:** `prisma.service.ts`
**Fix:** Replace `any` with proper type extended from Prisma client.
**Risk:** May require updating `@repo/database` export to expose the extended client type.

### #11 Docker includes devDependencies
**File:** `Dockerfile.backend`
**Fix:** Switch to `npm ci --omit=dev` in builder stage. Or use `turbo prune`.
**Risk:** Must verify build still works (devDeps may be needed for build step).

### #13 Preview regenerate lacks cleanup on unmount
**File:** `preview/page.tsx`
**Fix:** Store `setTimeout` ref and call `clearTimeout` in `useEffect` return cleanup.
**Risk:** None.

### #14 StorageService reads process.env directly
**File:** `storage.service.ts`
**Fix:** Inject `ConfigService` instead of reading `process.env` directly.
**Risk:** Low — consistent with existing pattern.

## Group D — Prototype Limitations (document only)

| # | Issue | Action |
|---|-------|--------|
| 6 | Subscription guard trusts `user-email` header | Add inline comment + backlog item |
| 8 | MockAuthGuard returns false when not mock | Add inline comment + backlog item |
| 9 | Stale book marking lacks userId filter | Add inline comment + backlog item |
| 15 | StoryLibrary backend unused | Add to backlog |

## Implementation Order

```
Phase 1: Group A (critical bugs)     → unblock core flow
Phase 2: Group B (data loss)         → prevent silent failures
Phase 3: Group C (quality)           → improve consistency
Phase 4: Group D (documentation)     → acknowledge limitations
```

Phases 1-3 each get their own conventional commit. Phase 4 is a single docs commit.
