# Editorial Storybook Design Refresh (Aggressive Visual, Stable Flow)

Date: 2026-05-27
Status: Approved for spec write
Scope: Full frontend UI refresh cycle

## 1. Goal and Success Criteria

Refresh the full frontend visual language with an aggressive editorial redesign while preserving existing routes and core user flows.

Success criteria:
1. All key screens share one cohesive Editorial Storybook style.
2. Routes and primary workflow semantics remain unchanged.
3. Desktop and mobile presentations are visually consistent and usable.
4. Existing frontend smoke tests remain green (with minimal assertion adjustments if needed).

## 2. Scope

In scope:
- `apps/frontend` pages:
  - dashboard (`/`)
  - wizard (`/books/new`)
  - preview (`/books/[id]/preview`)
  - book detail (`/books/[id]`)
  - profiles (`/profiles`)
  - settings (`/settings`)
- shared layout and reusable UI components used by these pages
- global design tokens and typography scale
- internal page composition updates (section ordering, CTA placement)

Out of scope:
- backend changes
- API contract changes
- route/path changes
- fundamental flow changes between pages

## 3. Design Direction

Chosen direction: **Editorial Storybook**

Visual principles:
- warm paper-like backgrounds with strong ink contrast
- expressive typography hierarchy for story-led interfaces
- clear rhythm using generous spacing and readable content columns
- handcrafted-feeling cards/containers with restrained decorative accents

## 4. UX Boundaries

Allowed:
- reordering sections inside a page
- updating hierarchy and emphasis of existing controls
- improving CTA prominence and content grouping

Not allowed:
- changing navigation structure or route map
- altering fundamental user journey between existing pages

## 5. UI System Contract

### 5.1 Global tokens

Update global style layer to include:
- editorial palette tokens (paper / ink / accent / support)
- typography scale for headings, section labels, body text, meta text
- radius, border, and shadow tokens aligned with the new visual language
- spacing rhythm rules for vertical sections and card internals

### 5.2 Component alignment

Bring these components into one visual system:
- `BookCard`
- `Pagination`
- `SpreadViewer`
- shared form blocks in wizard
- preview feedback blocks
- profile/settings cards

### 5.3 Motion policy

Use limited meaningful animation only:
- page-load reveal
- section stagger where beneficial
- no heavy or distracting micro-motion

## 6. Screen-Level Intent

1. Dashboard:
- stronger content-first hero and filter hierarchy
- clearer distinction between list controls and book grid

2. Create Wizard:
- narrative step framing with stronger step clarity
- cleaner form grouping and action progression

3. Preview:
- reading-focused spread area and feedback workspace
- stronger separation of review vs approve actions

4. Book Detail:
- improved metadata readability and action framing

5. Profiles:
- profile cards with better scanability and primary actions

6. Settings:
- simplified section clarity and hierarchy for account preferences

## 7. Validation Strategy

Required checks in implementation phase:
1. Manual visual validation on desktop and mobile for all six screens.
2. Verify contrast and tap target usability on updated UI.
3. Keep frontend smoke tests passing; update only fragile selectors/assertions.
4. Ensure Tailwind v4 compatibility is preserved.

## 8. Risks and Mitigations

Risk: Mobile regressions due to aggressive layout changes.
- Mitigation: mandatory per-screen mobile pass before completion.

Risk: Readability loss from expressive typography.
- Mitigation: enforce body text line-height, max-width, and contrast thresholds.

Risk: Style drift between pages.
- Mitigation: centralize tokens and shared component primitives before page-level polish.

## 9. Acceptance Checklist

- [ ] Editorial Storybook visual language applied across all key screens.
- [ ] Routes and core flows unchanged.
- [ ] Shared components aligned to one tokenized design system.
- [ ] Desktop and mobile visual verification completed.
- [ ] Frontend smoke tests passing after refresh.
