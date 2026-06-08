# Code Quality Hardening — Design Spec

**Date:** 2026-06-08
**Status:** Draft
**Scope:** Fix 15 code quality issues identified in code review across frontend, backend, Docker, and documentation.

## 1. Critical Path Bugs

### 1.1 Middleware: Remove hardcoded `hasProfiles`

**Problem:** `middleware.ts:11` sets `const hasProfiles = false`, making `/books/new` permanently redirect to `/profiles`. Users can never create a book.

**Solution:** Fetch profiles via a server-side API call in the middleware's async handler. The middleware already supports async functions.

**Implementation:**
1. Create a helper function that fetches `/child-profiles` from the backend via the internal rewrite URL
2. Pass `hasProfiles` based on the response length
3. Keep the redirect logic — redirect to `/profiles` only when `hasProfiles === false`

**Fallback:** If the API call fails, default to `true` (allow access) rather than blocking.

### 1.2 Pagination Filter Mismatch

**Problem:** The backend `findAll` in `book.service.ts` accepts `type` and `profile` query params but never applies them as SQL filters. Instead, `dashboard/page.tsx` fetches all paginated results then re-filters client-side with `applyDashboardBookFilterSort`, which: (a) makes `total`/`totalPages` wrong, (b) wastes bandwidth, (c) breaks pagination controls.

**Solution:** Move all filter logic to the backend. The server already has the query params — it just needs to use them.

**Implementation:**
1. Update `BookController.findAll` to accept and pass `type` (BookType) and `profile` (childId) query params
2. Update `BookService.findAll` to apply these as `where` conditions in the Prisma query
3. Remove `applyDashboardBookFilterSort` from the frontend `dashboard/page.tsx`
4. Keep only the `sort` logic (`sortBy`, `sortOrder`) in the frontend — or also move it to the backend

**Backward compatibility:** The existing API contract already accepts `search`, `status`, `style`, `page`, `limit`. Adding `type` and `profile` is additive.

## 2. Silent Failures

### 2.1 LLM Page Parsing

**Problem:** `book.processor.ts:42` uses `storyText.split(/Page \d+:)/` which fails on `**Page 1:**`, `Page 1.`, or any format deviation. The result is a single page with no error.

**Solution:** Make the parser more robust with format-agnostic regex and validation.

**Implementation:**
1. Match patterns: `Page \d+:`, `**Page \d+:**`, `Page \d+.`
2. Normalize: Strip markdown formatting before splitting
3. Validate: After split, check count > 1; if only 1 page, log warning and fall back to double-newline splitting
4. Report: If still 1 page, emit an error event with `pageCount: 1` so the processor can mark the book as FAILED

### 2.2 Settings `llmModel` Persistence

**Problem:** `settings.service.ts:33-59` only persists `reasoningEffort` but ignores `llmModel`.

**Solution:** Add `llmModel` field to the update query.

**Implementation:**
```typescript
await this.prisma.client.user.update({
  where: { id: userId },
  data: {
    preferredReasoningEffort: dto.reasoningEffort,
    preferredLlmModel: dto.llmModel,
  },
});
```

### 2.3 Generating Page: Stop Polling on FAILED

**Problem:** `generating/page.tsx` polls every 2s indefinitely on FAILED status. User has no way to recover.

**Solution:** Add max retries (60 attempts = 2 minutes). On exhaustion, render a FAILED state with: retry button (calls regenerate) and back-to-library button.

## 3. Code Quality

### 3.1 BullMQ → ConfigService

**Problem:** `app.module.ts:26-28` reads `process.env.REDIS_HOST/PORT` directly instead of using `ConfigService`.

**Solution:** Move BullMQ config into a factory function that injects `ConfigService`.

### 3.2 PDF Stream Cleanup

**Problem:** `pdf.service.ts:66-68` — when image fetch throws, `doc.end()` is never called, leaking the stream.

**Solution:** Wrap the loop in try/catch/finally. Close the doc in `finally`.

### 3.3 PrismaService Type

**Problem:** `prisma.service.ts:6` — `private prismaClient: any` loses all type safety.

**Solution:** Replace `any` with the proper client type exposed by `@repo/database`.

### 3.4 Docker devDependencies

**Problem:** `Dockerfile.backend:18` copies full `node_modules` including dev deps.

**Solution:** Add `npm prune --omit=dev` or use `turbo prune` to strip devDeps before copying.

### 3.5 Preview Regenerate Cleanup

**Problem:** `preview/page.tsx:86-112` — `setTimeout` callbacks reference potentially unmounted component.

**Solution:** Wrap in `useEffect` with cleanup:
```typescript
useEffect(() => {
  const timer = setTimeout(() => { ... }, 2000);
  return () => clearTimeout(timer);
}, [trigger]);
```

### 3.6 StorageService → ConfigService

**Problem:** `storage.service.ts:11-20` reads `process.env.AWS_REGION`, `AWS_ACCESS_KEY_ID`, etc. directly.

**Solution:** Inject `ConfigService` and read through it, same as the rest of the codebase.

## 4. Prototype Limitations (Documentation Only)

### 4.1 Issues kept as-is

| Issue | Location | Add Comment |
|-------|----------|-------------|
| Subscription guard trusts `user-email` header | `subscription.guard.ts` | `// TODO: Remove header fallback when real auth is implemented` |
| MockAuthGuard returns false when not mock | `mock-auth.guard.ts` | `// TODO: Replace with real auth guard` |
| Stale book marking lacks userId filter | `book.service.ts` | `// TODO: Add userId filter when multi-tenant auth is implemented` |

### 4.2 Backlog Update

Add an item to `docs/AGENTS-backlog.md`:
> **StoryLibrary Integration** — Backend has complete StoryLibrary module but frontend CreateBookPage doesn't use it. Connect the UI to `/api/stories` search endpoint.

## 5. Testing

| Fix | Test Strategy |
|-----|---------------|
| #1 Middleware profiles | Manual smoke test — navigate to `/books/new` |
| #2 Backend filters | Existing `BookService` specs: add test for `type`/`profile` filter params |
| #3 LLM parsing | Unit test for the parser helper with multiple formats |
| #4 Settings persistence | Unit test: verify both fields persisted |
| #5 BullMQ config | Integration test: verify ConfigService is used |
| #7 PDF cleanup | Hard to test — manual review |
| #10 Prisma type | Compile check — no runtime change |
| #11 Docker | `docker build -f Dockerfile.backend .` |
| #12 Polling stop | Component test: mock status transitions |
| #13 Cleanup | Component test: verify timeout cleared on unmount |
| #14 ConfigService | Unit test: verify ConfigService injected |

## 6. Commit Strategy

```
Phase 1 commit: fix(middleware): fetch profiles via API instead of hardcoding false
                fix(api): apply type and profile filters server-side for accurate pagination

Phase 2 commit: fix(processor): support multiple LLM page formats with validation
                fix(settings): persist llmModel field in generation settings
                fix(frontend): add max retries and failed state to generating page

Phase 3 commit: fix(config): use ConfigService for BullMQ Redis connection
                fix(pdf): ensure doc.end() is called in finally block
                fix(db): type PrismaService with correct PrismaClient type
                chore(docker): prune devDependencies in production stage
                fix(frontend): clearTimeout on preview regenerate unmount
                fix(storage): use ConfigService for MinIO credentials

Phase 4 commit: docs: document prototype limitations inline and in backlog
```
