# Shadcn Frontend Migration Design

Date: 2026-05-27
Status: Approved (brainstorming)
Scope: `apps/frontend`

## 1. Goal

Migrate the existing frontend UI to shadcn/ui with a unified app shell and sidebar navigation, while preserving existing business routes and backend API contracts.

This design covers:
- App shell with sidebar/navigation
- Separate auth pages (`/login`, `/signup`)
- Dashboard with `Grid` and `List` presentations
- Create Book page changes (`Combobox`, profile as `Card`)
- UI consistency rules and minimum testing/verification gates

Out of scope:
- Real auth integration
- Internet fairy-tale search backend implementation
- Backend API contract changes

## 2. Routing and Layout Architecture

### 2.1 Route groups

Use route groups to split layouts:
- `(app)` group: internal app pages with shared `AppShell`
- `(auth)` group: standalone auth pages without sidebar

Internal pages:
- `/` (dashboard)
- `/books/new`
- `/books/[id]`
- `/books/[id]/preview`
- `/profiles`
- `/settings`

Auth pages:
- `/login`
- `/signup`

### 2.2 App shell

Create a shadcn-based shell using sidebar pattern compatible with:
- `salimi-my-shadcn-ui-sidebar` structure as source of truth
- shadcn sidebar blocks style and primitives

Sidebar navigation items (MVP):
- Dashboard
- Create Book
- Profiles
- Settings

Global providers/theme stay in root `app/layout.tsx`; shell composition is route-group specific.

## 3. Dashboard Design

## 3.1 View modes

Dashboard supports two view modes:
- `Grid` (Data Table)
- `List` (uniform preview cards)

Persist view mode in URL query:
- `?view=grid|list`
- default: `grid`

## 3.2 Shared state and behavior

Both modes share one filter/sort/search state source:
- global text search by title
- facet filters: `status`, `type`, `style`, `profile`
- sorting:
  - `updated` (default desc)
  - `title`

Requirement: sorting and filtering must work in both `Grid` and `List` modes identically.

## 3.3 Grid mode (Data Table)

Use shadcn data-table pattern with columns:
- `Title`
- `Profile`
- `Type`
- `Style`
- `Status`
- `Updated`
- `Actions` (open/preview)

No extra columns beyond business need.

## 3.4 List mode

List mode renders equal-size book preview items in a left-to-right, top-to-bottom flow:
- fixed width across breakpoints
- consistent height via line clamp/constraints
- each item includes preview thumbnail, title, metadata (`profile/type/style/status`), updated time, and action button

## 3.5 Data and states

Data source remains existing books API.
Introduce view-model mapping layer so UI components consume normalized entities.

Required states:
- loading skeletons
- empty state with CTA (“Create your first book”)
- error state with retry

## 4. Create Book Page (`/books/new`)

## 4.1 Profile block

Profile selection UI is represented as `Card` with text/content inside.
Visual active/selected state must be explicit.

## 4.2 Story input via Combobox

Replace the input used for fairy tale selection/search with `Combobox`:
- supports selecting from prepared tale titles (existing list)
- supports free-text input (title/description)

At this stage behavior is UI-only for free-text search intent:
- no real internet search integration yet
- clear helper text indicates search integration is planned

## 4.3 Form actions and validation

All actions use shadcn `Button`.

Validation rules (MVP):
- primary CTA disabled if profile is not selected
- primary CTA disabled if story query is empty
- inline hint for missing required fields
- loading state on submit button
- submit errors via alert/toast

Payload and core creation flow contract remain unchanged.

## 5. Auth Pages

Implement standalone UI pages:
- `/login` based on shadcn login block
- `/signup` based on shadcn signup block

Constraints:
- no sidebar in auth layout
- UI-only submit handlers (no production auth wiring in this scope)
- responsive centered card-based composition

## 6. UI Standardization Rules

- All interactive buttons must be shadcn `Button`.
- Forms should use shadcn primitives (`Input`, `Label`, `Card`, `Alert`, etc.).
- Status indicators should use `Badge` where applicable.
- Minimize ad-hoc CSS; prefer shadcn + Tailwind utility composition.
- Keep existing theme/provider pipeline; migrate presentation to shadcn semantics.

## 7. Component Boundaries

Suggested structure:
- `components/app-shell/*` — sidebar/nav/header container
- `components/dashboard/*` — view toggle, filters, table, list item
- `components/books/*` — create form + combobox section
- `components/auth/*` — login/signup forms
- `components/ui/*` — base shadcn primitives only

## 8. Testing and Verification

Minimum required coverage for this migration:
- component tests:
  - grid/list toggle behavior
  - filtering and sorting in both modes
  - combobox preset selection + free text input
  - submit button enabled/disabled by validation
- smoke tests:
  - `/`, `/books/new`, `/login`, `/signup` render without crash
- regression checks:
  - existing book detail and preview routes still render and navigate

Verification gates before completion:
- frontend `typecheck` passes
- frontend `test` passes
- frontend `build` passes

## 9. Definition of Done

Migration is complete when:
1. Target pages use shadcn components for core UI.
2. Internal pages run under sidebar `AppShell`.
3. `/login` and `/signup` are separated into auth-only layout.
4. Dashboard provides `Grid` (Data Table) and `List`, both with filtering and sorting.
5. Create Book uses Combobox and profile Card; all actions use `Button`.
6. Frontend quality gates (`typecheck`, `test`, `build`) are green.

