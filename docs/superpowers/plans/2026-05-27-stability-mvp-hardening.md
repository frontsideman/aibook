# Stability MVP Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved hardening roadmap across Security+Env, Prisma workflow, Tailwind alignment, CI quality contract preparation, and baseline test foundation with minimal regression risk.

**Architecture:** Work is split into five independent epics that map 1:1 to approved specs. Each epic produces verifiable artifacts and keeps behavior changes isolated. We prioritize fail-fast configuration, deterministic DB workflow, and testability before broader UI and CI optimization.

**Tech Stack:** NestJS 10, Next.js 16, Prisma 7, Turbo, Jest, MSW, Tailwind CSS v4, npm workspaces

---

## Epic 1: Security + Env (Pass A, Balanced)

### Task 1.1: Add backend env validator

**Files:**
- Create: `apps/backend/src/config/env.validation.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Write failing tests for env validation behavior**

Create `apps/backend/src/config/env.validation.spec.ts` with tests for missing `DATABASE_URL`, invalid `REDIS_PORT`, invalid `MOCK_AUTH`, and valid minimal config.

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- env.validation.spec.ts` in `apps/backend`
Expected: FAIL because validator file does not exist.

- [ ] **Step 3: Implement minimal validator**

Implement `validateEnv(config: Record<string, unknown>)` that:
- throws on missing/empty `DATABASE_URL`
- validates numeric `REDIS_PORT` when provided
- validates `MOCK_AUTH` as `true|false` when provided
- returns normalized config object

- [ ] **Step 4: Wire validator into Nest config bootstrap**

Update `ConfigModule.forRoot` in `apps/backend/src/app.module.ts` to use `validate: validateEnv`.

- [ ] **Step 5: Run tests to verify pass**

Run: `npm run test -- env.validation.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/config/env.validation.ts apps/backend/src/config/env.validation.spec.ts apps/backend/src/app.module.ts
git commit -m "feat(backend): add fail-fast env validation"
```

### Task 1.2: Add env examples for all packages

**Files:**
- Create: `apps/backend/.env.example`
- Create: `apps/frontend/.env.example`
- Create: `packages/database/.env.example`

- [ ] **Step 1: Create backend env example**

Include required and optional vars:
`DATABASE_URL`, `PORT`, `REDIS_HOST`, `REDIS_PORT`, `S3_ENDPOINT`, `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `MOCK_AUTH`.

- [ ] **Step 2: Create frontend env example**

Include `BACKEND_URL` with default local value.

- [ ] **Step 3: Create database env example**

Include `DATABASE_URL` and note it is required for real DB access.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/.env.example apps/frontend/.env.example packages/database/.env.example
git commit -m "docs(env): add example env files for backend frontend and database"
```

---

## Epic 2: Prisma / DB Workflow (Migration-ready)

### Task 2.1: Normalize database package scripts

**Files:**
- Modify: `packages/database/package.json`

- [ ] **Step 1: Add missing DB workflow scripts**

Ensure scripts include:
- `generate`: `prisma generate`
- `migrate:dev`: `prisma migrate dev`
- `db:push`: `prisma db push`

- [ ] **Step 2: Validate scripts resolve**

Run in `packages/database`:
- `npm run generate`
- `npm run migrate:dev -- --help`
- `npm run db:push -- --help`
Expected: commands resolve.

- [ ] **Step 3: Commit**

```bash
git add packages/database/package.json
git commit -m "chore(database): add canonical prisma workflow scripts"
```

### Task 2.2: Add root proxy DB scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add root proxy scripts**

Add:
- `db:generate`: `npm --workspace packages/database run generate`
- `db:migrate:dev`: `npm --workspace packages/database run migrate:dev`
- `db:push`: `npm --workspace packages/database run db:push`
- `typecheck`: `turbo run typecheck`
- `test`: `turbo run test`

- [ ] **Step 2: Validate root scripts resolve**

Run from repo root:
- `npm run db:generate`
- `npm run db:migrate:dev -- --help`
- `npm run db:push -- --help`
Expected: commands run against `packages/database`.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(workspace): add db proxy and quality scripts"
```

---

## Epic 3: Tailwind / CSS Alignment (Compatibility Fix)

### Task 3.1: Align global CSS to Tailwind v4 entry

**Files:**
- Modify: `apps/frontend/src/app/globals.css`

- [ ] **Step 1: Replace legacy directives with v4 import**

Use only:
```css
@import "tailwindcss";
```
Keep existing custom CSS variables/utilities below it.

- [ ] **Step 2: Remove v3 directive remnants**

Ensure `@tailwind base/components/utilities` no longer exist.

- [ ] **Step 3: Validate frontend build pipeline**

Run in `apps/frontend`: `npm run build`
Expected: build succeeds without directive mismatch errors.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/globals.css
git commit -m "fix(frontend): align globals.css with tailwind v4"
```

### Task 3.2: Confirm PostCSS alignment

**Files:**
- Modify if needed: `apps/frontend/postcss.config.mjs` (or existing postcss config file)

- [ ] **Step 1: Ensure `@tailwindcss/postcss` plugin is active**

Keep minimal config compatible with Next.js 16 + Tailwind v4.

- [ ] **Step 2: Verify local dev start**

Run in `apps/frontend`: `npm run dev`
Expected: app starts; no postcss/tailwind plugin boot errors.

- [ ] **Step 3: Commit (if file changed)**

```bash
git add apps/frontend/postcss.config.*
git commit -m "chore(frontend): align postcss config for tailwind v4"
```

---

## Epic 4: CI Quality Gate Contract Preparation

### Task 4.1: Ensure workspace has all contract scripts

**Files:**
- Modify: `package.json`
- Modify if needed: `apps/backend/package.json`
- Modify if needed: `apps/frontend/package.json`

- [ ] **Step 1: Confirm workspace-level commands exist**

`lint`, `typecheck`, `test`, `build` must be runnable from root through Turbo.

- [ ] **Step 2: Add missing package-level scripts needed by Turbo**

If `typecheck`/`test` scripts are missing in app packages, add minimal implementations:
- backend `typecheck`: `tsc --noEmit`
- frontend `typecheck`: `tsc --noEmit`
- frontend `test`: placeholder command only if runner exists (added in Epic 5)

- [ ] **Step 3: Dry-run contract commands locally**

From root:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
Expected: commands execute; failures point to real code/test issues, not missing scripts.

- [ ] **Step 4: Commit**

```bash
git add package.json apps/backend/package.json apps/frontend/package.json
git commit -m "chore(workspace): prepare scripts for ci quality gate contract"
```

---

## Epic 5: Tests Foundation (Baseline, Risk-first)

### Task 5.1: Backend env validator tests (done in Epic 1) + critical gap audit

**Files:**
- Modify: `apps/backend/src/book/book.controller.spec.ts`
- Modify: `apps/backend/src/pdf/pdf.service.spec.ts`
- Modify: `apps/backend/src/book-generation/book.processor.spec.ts`

- [ ] **Step 1: Add/expand high-risk assertions**

Cover:
- controller user scoping and invalid transitions
- pdf service error handling branch
- processor failure path status update

- [ ] **Step 2: Run targeted backend tests**

Run:
- `npm run test -- src/book/book.controller.spec.ts`
- `npm run test -- src/pdf/pdf.service.spec.ts`
- `npm run test -- src/book-generation/book.processor.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/book/book.controller.spec.ts apps/backend/src/pdf/pdf.service.spec.ts apps/backend/src/book-generation/book.processor.spec.ts
git commit -m "test(backend): strengthen critical flow coverage"
```

### Task 5.2: Establish frontend test runner and smoke tests

**Files:**
- Create: `apps/frontend/vitest.config.ts` (or `jest.config.ts`, pick one)
- Create: `apps/frontend/src/test/setup.ts`
- Create: `apps/frontend/src/app/dashboard/page.spec.tsx`
- Create: `apps/frontend/src/app/create-book/page.spec.tsx`
- Create: `apps/frontend/src/app/books/[id]/preview/page.spec.tsx`
- Modify: `apps/frontend/package.json`

- [ ] **Step 1: Add test runner dependencies and script**

Use Vitest + Testing Library + jsdom and add `test` script.

- [ ] **Step 2: Add test setup with MSW integration**

Configure global setup for rendering and API mocks.

- [ ] **Step 3: Add three smoke tests**

Each test must assert screen renders without crash and key heading/action is visible.

- [ ] **Step 4: Run frontend tests**

Run in `apps/frontend`: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/package.json apps/frontend/vitest.config.ts apps/frontend/src/test/setup.ts apps/frontend/src/app/dashboard/page.spec.tsx apps/frontend/src/app/create-book/page.spec.tsx apps/frontend/src/app/books/[id]/preview/page.spec.tsx
git commit -m "test(frontend): add vitest and smoke coverage for core screens"
```

### Task 5.3: Define minimal e2e happy-path scaffold

**Files:**
- Create: `apps/frontend/e2e/book-happy-path.spec.ts`
- Create: `apps/frontend/playwright.config.ts`
- Modify: `apps/frontend/package.json`

- [ ] **Step 1: Add Playwright baseline config and script**

Add `test:e2e` script and local base URL.

- [ ] **Step 2: Add one happy-path test skeleton**

Flow: create book -> trigger generation -> observe status/progress UI.

- [ ] **Step 3: Run e2e in headed/headless local mode**

Run: `npm run test:e2e -- --reporter=list`
Expected: either PASS or clear deterministic failure tied to missing app state; no config/runtime boot errors.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/package.json apps/frontend/playwright.config.ts apps/frontend/e2e/book-happy-path.spec.ts
git commit -m "test(e2e): add minimal happy-path scaffold"
```

---

## Final Verification and Integration

### Task 6: End-to-end repository verification

**Files:**
- Modify (if needed): `docs/superpowers/plans/2026-05-27-stability-mvp-hardening.md` (checklist progress only)

- [ ] **Step 1: Run full quality commands from root**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
Expected: all pass.

- [ ] **Step 2: Verify env examples and db scripts presence**

Run:
- `ls apps/backend/.env.example apps/frontend/.env.example packages/database/.env.example`
- `npm run db:generate`
Expected: files exist and db command succeeds.

- [ ] **Step 3: Commit final stabilization batch**

```bash
git add -A
git commit -m "chore: complete mvp stability hardening baseline"
```

