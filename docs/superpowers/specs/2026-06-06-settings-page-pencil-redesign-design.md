# Settings Page Pencil Redesign

## Goal

Replace the current `/settings` page UI with the Pencil design selected in `docs/design/aibook.pen`, while preserving the current product scope:

- implement the full page layout and styling from the Pencil `Settings Main Content` frame
- keep only the currently real generation settings behavior wired to the backend
- do not add backend functionality, fake persistence, or misleading interactivity for account/billing features that do not exist yet

## Current Constraints

The current backend/frontend contract for settings is intentionally narrow:

- `GET /api/settings/generation` returns:
  - `llmModel`
  - `reasoningEffort`
- `PATCH /api/settings/generation` accepts:
  - `reasoningEffort`

The backend currently treats:

- `llmModel` as read-only, sourced from backend environment configuration
- `reasoningEffort` as the only user-editable setting on this page

This redesign must not imply that subscription, billing, profile preferences, notification preferences, or account deletion are already supported by the product.

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

### Real behavior

Only one slice of the page is real and connected to the backend:

- load generation settings from `GET /api/settings/generation`
- display `llmModel` as read-only
- allow editing `reasoningEffort`
- save only `{ reasoningEffort }` via `PATCH /api/settings/generation`

### Decorative or unavailable behavior

All other controls shown in the Pencil layout are presentational only in this iteration.

These controls should render as disabled or otherwise non-interactive UI:

- `Manage billing`
- `Download invoices`
- notification toggles
- account preference fields
- account preference `Cancel`
- danger zone delete action
- delete confirmation input
- delete confirmation actions

The UI should include short honest copy near unavailable sections so the page does not look broken, but it must not invent workflow details or suggest hidden functionality.

## UI Structure

The page should be rebuilt around several presentation panels that match the Pencil hierarchy.

### Header

The header includes:

- `ACCOUNT` eyebrow
- `Settings` title
- subtitle matching the Pencil design direction around subscription, billing, and account preferences

### Subscription and Billing row

This row visually matches Pencil:

- left panel shows current plan summary
- right panel shows billing summary and two actions

This content is static for now. The actions are disabled.

### Account preferences panel

This panel keeps the Pencil field layout, but only one field is functionally tied to the backend settings contract:

- `Model` shown as read-only
- `Reasoning effort` editable and loaded from the API

The remaining account preference fields from Pencil are visually present but disabled.

The panel keeps its action row from Pencil:

- `Cancel` disabled
- `Save changes` active and bound to the real generation settings save action

The page should not introduce a second save workflow outside this panel.

### Notification preferences panel

This panel matches Pencil visually and is fully disabled in this iteration.

### Danger zone panel

This panel matches Pencil visually and is fully disabled in this iteration.

## State Handling

### Loading

The Pencil page chrome should render immediately.

Only the real generation settings area inside the account preferences panel should show loading placeholders or muted temporary content while `GET /api/settings/generation` is pending.

### Load error

If generation settings fail to load:

- keep the rest of the Pencil page visible
- show the error only in the real settings area
- do not collapse the account preferences panel

### Save success and save error

Save feedback should appear inline inside the account preferences panel:

- success message after a successful PATCH
- error message after a failed PATCH

These messages should not reflow the entire page dramatically or appear in unrelated panels.

## Component Boundaries

The page should use small presentation-focused components to keep the composition readable and maintainable.

Recommended structure:

- `SettingsPage` owns fetch/save logic for generation settings and assembles the page
- supporting UI components live under `apps/frontend/src/components/settings/`
- supporting components are presentation-only and should not own backend logic

Likely component types:

- panel wrapper
- static field
- disabled action/button row
- toggle row
- inline status message

This keeps the real settings behavior isolated from the Pencil-only decorative sections.

## Content Rules

Content should stay close to the Pencil design for layout and tone, but the implementation may make small copy adjustments where needed to remain honest about product scope.

The redesign must avoid:

- fake saves
- local-only toggles that pretend to persist
- clickable unavailable actions
- extra explanatory banners not required by the design

## Testing

Frontend tests should verify:

- the page loads generation settings into the redesigned panel
- `llmModel` renders as read-only content
- `reasoningEffort` can be changed and saved
- PATCH sends only `{ reasoningEffort }`
- load failures show an inline error while the rest of the page still renders
- save failures show an inline error in the real settings panel
- unavailable controls render disabled

## Out of Scope

This redesign does not include:

- backend billing or subscription APIs
- editable profile/account preference persistence
- notification preference persistence
- account deletion flow
- any new backend settings fields beyond the existing generation settings contract

## Acceptance Criteria

1. `/settings` visually follows the selected Pencil `Settings Main Content` layout rather than the current simple form.
2. The existing page content is replaced by the Pencil-based composition.
3. `llmModel` is displayed read-only from backend data.
4. `reasoningEffort` is the only editable persisted field.
5. Saving sends only `{ reasoningEffort }` to `PATCH /api/settings/generation`.
6. Nonexistent product features shown in the design render as disabled UI rather than fake interactive behavior.
7. Loading, save success, and save error states are localized to the real generation settings area.
