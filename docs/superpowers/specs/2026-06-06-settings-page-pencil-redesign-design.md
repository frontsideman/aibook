# Settings Page Pencil Redesign

## Goal

Replace the current `/settings` page UI with the Pencil design selected in `docs/design/aibook.pen`, while keeping the page purely presentational in this iteration.

This redesign should:

- implement the full page layout and styling from the Pencil `Settings Main Content` frame
- remove the current generation settings UI entirely
- avoid adding backend functionality, fake persistence, or misleading interactivity

## Current Product Direction

The page should no longer expose any real settings controls.

In particular:

- do not show `llmModel`
- do not show `reasoningEffort`
- do not render a working save action
- do not fetch or patch `/api/settings/generation`

The backend settings endpoints may still exist, but they are out of scope for this page redesign and should not drive the UI.

## Design Source

The implementation should visually follow the selected Pencil frame:

- file: `docs/design/aibook.pen`
- selected node: `Settings Main Content`

The target composition includes:

- page header with eyebrow, title, and subtitle
- subscription status panel
- billing action panel
- account preferences panel
- notification preferences panel
- danger zone panel with deletion confirmation area

The existing Settings page content can be removed entirely and replaced with this composition.

## Product Behavior

This page is presentation-only in this iteration.

All visible controls shown in the Pencil layout are non-functional UI.

These controls should render as disabled or otherwise non-interactive:

- `Manage billing`
- `Download invoices`
- account preference fields
- account preference `Cancel`
- account preference `Save changes`
- notification toggles
- danger zone delete action
- delete confirmation input
- delete confirmation actions

The page should not perform any settings fetch, save, or optimistic updates.

## UI Structure

The page should be rebuilt around several presentation panels that match the Pencil hierarchy.

### Header

The header includes:

- `ACCOUNT` eyebrow
- `Settings` title
- subtitle aligned with the Pencil design direction around subscription, billing, and account preferences

### Subscription and Billing row

This row visually matches Pencil:

- left panel shows current plan summary
- right panel shows billing summary and two actions

This content is static. Both actions are disabled.

### Account preferences panel

This panel follows the Pencil field layout as a static preferences surface.

It should not include generation settings fields.

The visible fields are the Pencil account fields only, rendered as disabled UI.

The action row remains presentational:

- `Cancel` disabled
- `Save changes` disabled

### Notification preferences panel

This panel matches Pencil visually and is fully disabled in this iteration.

### Danger zone panel

This panel matches Pencil visually and is fully disabled in this iteration.

## State Handling

There is no loading, save success, save error, or fetch error state on this page anymore.

The page should render as static UI immediately.

## Component Boundaries

The page should use small presentation-focused components to keep the composition readable and maintainable.

Recommended structure:

- `SettingsPage` assembles the page composition only
- supporting UI components live under `apps/frontend/src/components/settings/`
- supporting components are presentation-only and do not own backend logic

Likely component types:

- panel wrapper
- static field
- disabled action/button row
- toggle row

## Content Rules

Content should stay close to the Pencil design for layout and tone, but the implementation may make small copy adjustments where needed to remain honest about product scope.

The redesign must avoid:

- fetch or save behavior
- fake persistence
- local-only toggles that pretend to persist
- clickable unavailable actions
- extra explanatory banners not required by the design
- generation settings terminology on the page

## Testing

Frontend tests should verify:

- the page renders the Pencil-inspired header and section structure
- generation settings content from the old page is gone
- `llmModel` and `reasoningEffort` are not shown
- all visible actions and toggles are disabled
- the page does not depend on loading or save states

## Out of Scope

This redesign does not include:

- backend billing or subscription APIs
- generation settings fetch or persistence
- editable profile/account preference persistence
- notification preference persistence
- account deletion flow

## Acceptance Criteria

1. `/settings` visually follows the selected Pencil `Settings Main Content` layout rather than the current simple form.
2. The existing page content is replaced by the Pencil-based composition.
3. The page does not render `llmModel`, `reasoningEffort`, or a real generation settings section.
4. The page does not fetch or save `/api/settings/generation`.
5. All visible controls render as disabled or otherwise non-interactive UI.
6. The page is static and does not show loading, success, or error states tied to settings persistence.
