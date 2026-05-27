# Tailwind / CSS Alignment Design (Compatibility Fix)

Date: 2026-05-27
Status: Approved for spec write
Scope: Sub-project 3 from stability roadmap

## 1. Goal and Success Criteria

Align frontend styling infrastructure to a single Tailwind v4-compatible path for Next.js 16, without doing visual QA in this cycle.

Success criteria:
1. Frontend CSS/Tailwind wiring follows one consistent v4-compatible approach.
2. Legacy v3-style directive mismatch is removed from global styling entrypoint.
3. Frontend build/dev pipeline is configuration-consistent for Tailwind v4.

## 2. Scope

In scope:
- `apps/frontend` only
- Global CSS entrypoint alignment
- PostCSS wiring alignment

Out of scope:
- Visual verification of screens
- Style polish or redesign
- Component-level class rewrites

## 3. Technical Contract

- `globals.css` uses Tailwind v4 entrypoint: `@import "tailwindcss";`.
- Remove v3 directives if present:
  - `@tailwind base;`
  - `@tailwind components;`
  - `@tailwind utilities;`
- PostCSS config remains aligned with `@tailwindcss/postcss` plugin.
- No intentional UI behavior changes; this is infra-level styling pipeline alignment only.

## 4. Error Flow

- If mismatch persists, failures or warnings appear during `next dev` / `next build` CSS processing.
- Any resulting fixes in this cycle are limited to configuration/pipeline files, not UI component redesign.

## 5. Validation Strategy

This cycle validates technical consistency only:
1. Frontend starts/builds with aligned Tailwind pipeline.
2. No mixed v3/v4 directive setup remains in global entrypoint.

Visual validation is intentionally deferred to the later UI completion phase.

## 6. Risks and Mitigations

Risk: Visual regressions may exist without immediate detection.
- Mitigation: explicitly defer and schedule visual QA after full UI cycle (as requested).

Risk: Hidden plugin-level incompatibility.
- Mitigation: keep changes minimal and constrained to CSS/postcss wiring, verify build pipeline health.

## 7. Acceptance Checklist

- [ ] `apps/frontend` uses single v4-compatible Tailwind entry approach.
- [ ] v3 `@tailwind ...` directives removed from global CSS entrypoint.
- [ ] PostCSS config is aligned with `@tailwindcss/postcss`.
- [ ] No component-level redesign introduced in this cycle.
