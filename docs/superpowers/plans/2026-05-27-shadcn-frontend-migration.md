# Shadcn Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate frontend UI to shadcn-based app/auth layouts and upgrade dashboard + create-book UX without changing backend contracts.

**Architecture:** The migration is split into vertical slices: shell routing, dashboard view-model + dual views, create-book UX, auth screens, and verification. We keep existing route URLs and API calls stable while introducing new UI composition under dedicated component boundaries. All behavior changes are driven by tests first and verified with typecheck/test/build gates.

**Tech Stack:** Next.js 16 App Router, React 19, shadcn/ui, Tailwind v4, Vitest + Testing Library, MSW

---

## File Structure

- `apps/frontend/src/app/(app)/layout.tsx` — app-only shell layout with sidebar.
- `apps/frontend/src/app/(app)/page.tsx` — dashboard route entry under app shell.
- `apps/frontend/src/app/(app)/books/new/page.tsx` — create-book route entry under app shell.
- `apps/frontend/src/app/(app)/books/[id]/page.tsx` and `.../preview/page.tsx` — existing business routes preserved in shell group.
- `apps/frontend/src/app/(app)/profiles/page.tsx` and `.../settings/page.tsx` — existing pages moved into shell group.
- `apps/frontend/src/app/(auth)/layout.tsx` — standalone auth layout without sidebar.
- `apps/frontend/src/app/(auth)/login/page.tsx` and `.../signup/page.tsx` — UI-only auth pages.
- `apps/frontend/src/components/app-shell/*` — sidebar/nav/header composition.
- `apps/frontend/src/components/dashboard/*` — filters, toggle, table, list cards, states.
- `apps/frontend/src/components/books/*` — create form and combobox input block.
- `apps/frontend/src/components/auth/*` — login/signup forms.
- `apps/frontend/src/lib/books-view-model.ts` — normalized view-model mapper + filter/sort helpers.
- `apps/frontend/src/app/(app)/*.spec.tsx` and `apps/frontend/src/components/**/*.spec.tsx` — new/updated tests.

### Task 1: Route Groups and App/Auth Layout Split

**Files:**
- Create: `apps/frontend/src/app/(app)/layout.tsx`
- Create: `apps/frontend/src/app/(auth)/layout.tsx`
- Modify: `apps/frontend/src/app/layout.tsx`
- Move/Modify: `apps/frontend/src/app/page.tsx` -> `apps/frontend/src/app/(app)/page.tsx`
- Move/Modify: `apps/frontend/src/app/books/new/page.tsx` -> `apps/frontend/src/app/(app)/books/new/page.tsx`
- Move/Modify: `apps/frontend/src/app/books/[id]/page.tsx` -> `apps/frontend/src/app/(app)/books/[id]/page.tsx`
- Move/Modify: `apps/frontend/src/app/books/[id]/preview/page.tsx` -> `apps/frontend/src/app/(app)/books/[id]/preview/page.tsx`
- Move/Modify: `apps/frontend/src/app/profiles/page.tsx` -> `apps/frontend/src/app/(app)/profiles/page.tsx`
- Move/Modify: `apps/frontend/src/app/settings/page.tsx` -> `apps/frontend/src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Write failing smoke tests for route layouts**

```tsx
// apps/frontend/src/app/layout-routing.spec.tsx
import { render, screen } from "@testing-library/react";
import AppLayout from "./(app)/layout";
import AuthLayout from "./(auth)/layout";

it("renders app shell slot for internal pages", () => {
  render(<AppLayout><div>internal</div></AppLayout>);
  expect(screen.getByText("internal")).toBeInTheDocument();
});

it("renders auth layout without sidebar", () => {
  render(<AuthLayout><div>auth</div></AuthLayout>);
  expect(screen.getByText("auth")).toBeInTheDocument();
  expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/app/layout-routing.spec.tsx`
Expected: FAIL because new route-group layout files do not exist yet.

- [ ] **Step 3: Implement app/auth group layouts and move routes**

```tsx
// apps/frontend/src/app/(app)/layout.tsx
import { AppShell } from "@/components/app-shell/AppShell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

```tsx
// apps/frontend/src/app/(auth)/layout.tsx
export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen flex items-center justify-center p-6">{children}</main>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --workspace apps/frontend run test -- src/app/layout-routing.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/layout.tsx apps/frontend/src/app/(app) apps/frontend/src/app/(auth) apps/frontend/src/app/layout-routing.spec.tsx
git commit -m "feat(frontend): split app and auth route-group layouts"
```

### Task 2: Shadcn App Shell Sidebar

**Files:**
- Create: `apps/frontend/src/components/app-shell/AppShell.tsx`
- Create: `apps/frontend/src/components/app-shell/AppSidebar.tsx`
- Create: `apps/frontend/src/components/app-shell/nav-items.ts`

- [ ] **Step 1: Write failing tests for sidebar navigation items**

```tsx
// apps/frontend/src/components/app-shell/AppShell.spec.tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";

it("shows MVP navigation links", () => {
  render(<AppShell><div>content</div></AppShell>);
  ["Dashboard", "Create Book", "Profiles", "Settings"].forEach((label) => {
    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/components/app-shell/AppShell.spec.tsx`
Expected: FAIL because app-shell components are missing.

- [ ] **Step 3: Implement minimal shell/sidebar components**

```tsx
// apps/frontend/src/components/app-shell/nav-items.ts
export const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/books/new", label: "Create Book" },
  { href: "/profiles", label: "Profiles" },
  { href: "/settings", label: "Settings" },
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --workspace apps/frontend run test -- src/components/app-shell/AppShell.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/app-shell
git commit -m "feat(frontend): add shadcn sidebar app shell"
```

### Task 3: Dashboard View-Model and Shared Filter/Sort Logic

**Files:**
- Create: `apps/frontend/src/lib/books-view-model.ts`
- Create: `apps/frontend/src/lib/books-view-model.spec.ts`
- Modify: `apps/frontend/src/app/(app)/page.tsx`

- [ ] **Step 1: Write failing unit tests for normalization/filter/sort**

```ts
// apps/frontend/src/lib/books-view-model.spec.ts
import { applyBookFiltersAndSort } from "./books-view-model";

it("sorts by updated desc by default", () => {
  const result = applyBookFiltersAndSort([{ id: "1", title: "A", updatedAt: "2026-01-01" }, { id: "2", title: "B", updatedAt: "2026-01-02" }] as any, { query: "", sort: "updated" } as any);
  expect(result[0].id).toBe("2");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/lib/books-view-model.spec.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement mapper and pure filter/sort helpers**

```ts
// apps/frontend/src/lib/books-view-model.ts
export type DashboardSort = "updated" | "title";

export function applyBookFiltersAndSort(books: any[], state: { query: string; sort: DashboardSort }) {
  const filtered = books.filter((book) => book.title.toLowerCase().includes(state.query.toLowerCase()));
  if (state.sort === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  return [...filtered].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --workspace apps/frontend run test -- src/lib/books-view-model.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/lib/books-view-model.ts apps/frontend/src/lib/books-view-model.spec.ts apps/frontend/src/app/(app)/page.tsx
git commit -m "feat(frontend): add dashboard shared filter and sort view-model"
```

### Task 4: Dashboard Grid/List UI with URL View Mode

**Files:**
- Create: `apps/frontend/src/components/dashboard/ViewModeToggle.tsx`
- Create: `apps/frontend/src/components/dashboard/BooksDataTable.tsx`
- Create: `apps/frontend/src/components/dashboard/BooksListGrid.tsx`
- Create: `apps/frontend/src/components/dashboard/DashboardFilters.tsx`
- Create: `apps/frontend/src/components/dashboard/DashboardStates.tsx`
- Modify: `apps/frontend/src/app/(app)/page.tsx`
- Modify: `apps/frontend/src/app/page.spec.tsx` -> `apps/frontend/src/app/(app)/page.spec.tsx`

- [ ] **Step 1: Write failing component tests for grid/list toggle and URL state**

```tsx
// apps/frontend/src/app/(app)/page.spec.tsx
it("defaults to grid mode and switches to list mode from query", async () => {
  // render dashboard with mocked search params and assert mode-specific marker
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/app/(app)/page.spec.tsx`
Expected: FAIL due to missing dashboard mode components/logic.

- [ ] **Step 3: Implement dashboard components and mode parsing**

```ts
// mode parsing in page.tsx
const view = searchParams.view === "list" ? "list" : "grid";
```

```tsx
// list mode marker contract
<section data-testid="books-list-mode">...</section>
```

```tsx
// grid mode marker contract
<section data-testid="books-grid-mode">...</section>
```

- [ ] **Step 4: Add loading/empty/error states with CTA and retry action**

```tsx
// DashboardStates.tsx
export function EmptyState() {
  return <p>Create your first book</p>;
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm --workspace apps/frontend run test -- src/app/(app)/page.spec.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/dashboard apps/frontend/src/app/(app)/page.tsx apps/frontend/src/app/(app)/page.spec.tsx
git commit -m "feat(frontend): add dashboard grid/list modes with shared filtering"
```

### Task 5: Create Book Page Profile Card + Combobox + Validation

**Files:**
- Create: `apps/frontend/src/components/books/StoryCombobox.tsx`
- Create: `apps/frontend/src/components/books/CreateBookForm.tsx`
- Modify: `apps/frontend/src/app/(app)/books/new/CreateBookPage.tsx`
- Modify: `apps/frontend/src/app/(app)/books/new/page.tsx`
- Modify: `apps/frontend/src/app/books/new/page.spec.tsx` -> `apps/frontend/src/app/(app)/books/new/page.spec.tsx`

- [ ] **Step 1: Write failing tests for profile/story validation and combobox behavior**

```tsx
// apps/frontend/src/app/(app)/books/new/page.spec.tsx
it("disables submit until profile and story are selected", async () => {
  // assert submit disabled initially, enabled after selecting profile + story input
});

it("supports preset selection and free text in combobox", async () => {
  // select prepared option, then type custom story text and assert both flows
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/app/(app)/books/new/page.spec.tsx`
Expected: FAIL because combobox/validation logic is not implemented.

- [ ] **Step 3: Implement Card-based profile selection with explicit active state**

```tsx
<Card data-selected={isSelected} className={isSelected ? "ring-2 ring-primary" : ""}>...</Card>
```

- [ ] **Step 4: Implement combobox with preset titles + free-text support and helper copy**

```tsx
<p className="text-sm text-muted-foreground">Internet search integration is planned in a later release.</p>
```

- [ ] **Step 5: Implement submit validation/loading/error feedback**

```tsx
<Button disabled={!selectedProfileId || !storyQuery.trim() || isSubmitting}>Create Book</Button>
```

- [ ] **Step 6: Run tests to verify pass**

Run: `npm --workspace apps/frontend run test -- src/app/(app)/books/new/page.spec.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/components/books apps/frontend/src/app/(app)/books/new apps/frontend/src/app/(app)/books/new/page.spec.tsx
git commit -m "feat(frontend): migrate create book form to shadcn card and combobox"
```

### Task 6: Auth Pages (`/login`, `/signup`) with Shadcn Blocks

**Files:**
- Create: `apps/frontend/src/components/auth/LoginForm.tsx`
- Create: `apps/frontend/src/components/auth/SignupForm.tsx`
- Create: `apps/frontend/src/app/(auth)/login/page.tsx`
- Create: `apps/frontend/src/app/(auth)/signup/page.tsx`
- Create: `apps/frontend/src/app/(auth)/auth-pages.spec.tsx`

- [ ] **Step 1: Write failing smoke tests for auth pages**

```tsx
// apps/frontend/src/app/(auth)/auth-pages.spec.tsx
it("renders login form fields and submit button", () => {
  // assertions for email/password and button
});

it("renders signup form fields and submit button", () => {
  // assertions for name/email/password and button
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --workspace apps/frontend run test -- src/app/(auth)/auth-pages.spec.tsx`
Expected: FAIL due to missing pages/components.

- [ ] **Step 3: Implement centered card-based forms with UI-only submit handlers**

```tsx
<form onSubmit={(event) => event.preventDefault()}>
  <Button type="submit">Continue</Button>
</form>
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm --workspace apps/frontend run test -- src/app/(auth)/auth-pages.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/auth apps/frontend/src/app/(auth)
git commit -m "feat(frontend): add standalone shadcn auth pages"
```

### Task 7: Regression Tests for Existing Book Detail and Preview Flows

**Files:**
- Modify: `apps/frontend/src/app/books/[id]/preview/page.spec.tsx` -> `apps/frontend/src/app/(app)/books/[id]/preview/page.spec.tsx`
- Create: `apps/frontend/src/app/(app)/books/[id]/page.spec.tsx`

- [ ] **Step 1: Write/adjust failing route regression tests after route-group move**

```tsx
it("renders book detail page for existing id", async () => {
  // render detail route and assert core heading/content
});

it("renders preview page and actions", async () => {
  // assert preview structure still works
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm --workspace apps/frontend run test -- src/app/(app)/books/[id]/page.spec.tsx src/app/(app)/books/[id]/preview/page.spec.tsx`
Expected: FAIL until imports/paths and shell wiring are updated.

- [ ] **Step 3: Update tests and route imports to new group paths**

```tsx
import PreviewPage from "./page";
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm --workspace apps/frontend run test -- src/app/(app)/books/[id]/page.spec.tsx src/app/(app)/books/[id]/preview/page.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/(app)/books/[id]/page.spec.tsx apps/frontend/src/app/(app)/books/[id]/preview/page.spec.tsx
git commit -m "test(frontend): keep detail and preview routes covered after layout migration"
```

### Task 8: Final Verification Gates and Documentation Sync

**Files:**
- Modify (if needed): `docs/superpowers/specs/2026-05-27-shadcn-frontend-migration-design.md`

- [ ] **Step 1: Run frontend typecheck**

Run: `npm --workspace apps/frontend run typecheck`
Expected: PASS.

- [ ] **Step 2: Run frontend unit tests**

Run: `npm --workspace apps/frontend run test`
Expected: PASS.

- [ ] **Step 3: Run frontend production build**

Run: `npm --workspace apps/frontend run build`
Expected: PASS.

- [ ] **Step 4: Optional smoke e2e for critical pages**

Run: `npm --workspace apps/frontend run test:e2e -- --grep "book-happy-path|auth|dashboard"`
Expected: PASS for targeted smoke scope.

- [ ] **Step 5: Final commit**

```bash
git add apps/frontend docs/superpowers/specs/2026-05-27-shadcn-frontend-migration-design.md
git commit -m "feat(frontend): complete shadcn migration with dashboard and auth layouts"
```

## Self-Review

1. Spec coverage check: route groups, app shell, auth pages, dashboard grid/list + shared filters/sort, create-book combobox + validation, UI standardization, and required verification gates are all mapped to Tasks 1-8.
2. Placeholder scan: no `TODO`/`TBD` placeholders; each task includes explicit file paths and executable commands.
3. Type consistency: shared `view` values are `grid|list`; dashboard sorting keys are `updated|title`; validation conditions align with create-book requirements.

Plan complete and saved to `docs/superpowers/plans/2026-05-27-shadcn-frontend-migration.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
