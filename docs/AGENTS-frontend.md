# Frontend

## Routes

### Authenticated App Routes (`apps/frontend/src/app/(app)/`)

- `/` — dashboard, filters, status summary, pagination
- `/books/new` — create flow
- `/books/[id]` — detail route that redirects by book status; completed books show
  the **Download PDF** action
- `/books/[id]/generating` — polling, failure recovery, retry
- `/books/[id]/preview` — review, inline page edits, regeneration, approval
- `/profiles` — child profile CRUD
- `/settings` — static account/subscription presentation
- `/notifications` — empty-state placeholder linked from the dashboard header

### Auth-Facing Routes (`apps/frontend/src/app/(auth)/`)

- `/login`
- `/signup`
- `/forgot-password` — explains that password reset is unavailable in the mock-auth demo

### Other

- `/logout` — clears the local mock session

## Routing Rules

Breadcrumbs are generated from `navItems` plus pathname fallback in `PageBreadcrumb.tsx`.

When adding a page under `apps/frontend/src/app/(app)/`:

- Add a matching `navItems` entry in `apps/frontend/src/components/app-shell/nav-items.ts`
  if it belongs in sidebar navigation
- Keep breadcrumb labels aligned with the `navItems` label when possible
- Preserve the existing status-based routing for `/books/[id]`

`/books/[id]` is not a normal detail page entry point. It redirects:

- `DRAFT`, `GENERATING`, `FAILED` → `/books/[id]/generating`
- `REVIEW` → `/books/[id]/preview`
- `COMPLETED` stays on the detail page

The generating page polls until `REVIEW`/`COMPLETED`, stops on `FAILED` or after
150 attempts (about 5 minutes), and can resume polling or call
`PATCH /books/:id/regenerate`.

The preview page combines page-specific notes with global feedback before
regeneration, so page notes are not lost. Page-only edits are applied in place and
the preview is refetched.

## Settings Page

`/settings` is intentionally presentation-only. It does not fetch or save
generation settings, and all visible controls are disabled. Do not document it as
a working settings form.

## PDF Download

Completed books call `POST /api/books/:id/pdf`. The backend lazily creates the PDF,
stores it in MinIO, and returns `{ pdfUrl }`; the page opens that URL.

## Styling

Frontend global styles are in `apps/frontend/src/app/globals.css`.

- Tailwind v4-style `@import "tailwindcss";` is already in use.
- Design tokens and theme variables are defined directly in `globals.css`.
- The app uses `next/font` with `Inter`, `Newsreader`, and `IBM Plex Mono`.

Preserve the established visual language unless the task is explicitly a redesign.

## Testing

- Frontend uses Vitest and Testing Library.
- Runtime MSW-backed API mocking has been removed; tests mock `fetch` or exercise
  backend responses explicitly. `msw` is no longer a dependency.
- `src/test/setup.ts` installs a deterministic `localStorage` polyfill for Node
  versions where `window.localStorage` is unavailable.
- Playwright is exposed through `apps/frontend` via `npm run test:e2e`. The current
  test stubs `/api/*` and verifies that the create-book form becomes ready; it does
  not start the backend. Set `PLAYWRIGHT_PORT=3100` if port 3000 is already occupied.
- For local development, run the frontend outside Docker with
  `npm run dev --workspace=apps/frontend`; this avoids file-watching issues in bind mounts.
- Profiles page responses are normalized defensively before rendering; avoid
  assuming `/api/child-profiles` always returns a bare array.
- Sidebar account text comes from the current mock session, not a hardcoded name.

When changing route behavior, auth flow, or dashboard/book lifecycle logic, update
or add frontend specs near the affected route/component.
