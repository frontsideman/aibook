# Editorial Storybook Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply an aggressive editorial visual refresh across all frontend screens while preserving existing routes and core user flows.

**Architecture:** Start with shared design tokens and layout shell, then align reusable components, then update page-level composition for dashboard, wizard, preview, detail, profiles, and settings. Validate with frontend typecheck/test/build and manual desktop/mobile checks.

**Tech Stack:** Next.js 16, Tailwind CSS v4, React 19, Vitest

---

### Task 1: Global Design System and Layout Shell
- [ ] Update `apps/frontend/src/app/globals.css` with Editorial Storybook tokens (paper/ink/accent/support), typography scale, spacing rhythm.
- [ ] Update `apps/frontend/src/app/layout.tsx` nav and content shell to the new editorial frame.
- [ ] Verify frontend build passes.

### Task 2: Shared Component Alignment
- [ ] Refresh `BookCard`, `Pagination`, `SpreadViewer`, `ProfileSelector` styles to a consistent visual language.
- [ ] Keep component APIs unchanged.
- [ ] Verify smoke tests still pass.

### Task 3: Page Composition Refresh
- [ ] Refresh `/` dashboard composition and controls hierarchy.
- [ ] Refresh `/books/new` wizard sections and CTA hierarchy.
- [ ] Refresh `/books/[id]/preview` review workspace.
- [ ] Refresh `/books/[id]` detail page presentation.
- [ ] Refresh `/profiles` and `/settings` pages.

### Task 4: Verification
- [ ] Run `apps/frontend`: `npm run typecheck`, `npm run test`, `npm run build`.
- [ ] Confirm no route or API-flow changes.
- [ ] Commit implementation changes.
