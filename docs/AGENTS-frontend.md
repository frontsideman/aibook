# Frontend

## Routes

### Authenticated App Routes (`apps/frontend/src/app/(app)/`)

- `/` — dashboard and library filters
- `/books/new` — create flow
- `/books/[id]` — detail route that redirects by book status
- `/books/[id]/generating` — polling/loading state
- `/books/[id]/preview` — review and approval flow
- `/profiles` — child profiles
- `/settings` — generation settings

### Auth-Facing Routes (`apps/frontend/src/app/(auth)/`)

- `/login`
- `/signup`

### Other

- `/logout` — clears the current frontend mock session

## Routing Rules

Breadcrumbs are generated from `navItems` plus pathname fallback in `PageBreadcrumb.tsx`.

When adding a page under `apps/frontend/src/app/(app)/`:

- Add a matching `navItems` entry in `apps/frontend/src/components/app-shell/nav-items.ts` if it belongs in sidebar navigation
- Keep breadcrumb labels aligned with the `navItems` label when possible
- Preserve the existing status-based routing for `/books/[id]`

`/books/[id]` is not a normal detail page entry point. It redirects:

- `DRAFT`, `GENERATING`, `FAILED` → `/books/[id]/generating`
- `REVIEW` → `/books/[id]/preview`
- Completed books stay on the detail page

If you touch this flow, update the corresponding route tests.

## Styling

Frontend global styles are in `apps/frontend/src/app/globals.css`.

- Tailwind v4-style `@import "tailwindcss";` is already in use.
- Design tokens and theme variables are defined directly in `globals.css`.
- The app uses `next/font` with `Inter`, `Newsreader`, and `IBM Plex Mono`.

Preserve the established visual language unless the task is explicitly a redesign.

## Testing

- Frontend uses Vitest and Testing Library
- Runtime MSW-backed API mocking has been removed; the frontend talks to the backend directly via `/api/*` rewrites, and tests mock `fetch` or exercise the backend responses explicitly
- Playwright is installed and exposed through `apps/frontend` via `npm run test:e2e`
- For local development, run the frontend outside Docker with `npm run dev --workspace=apps/frontend` when the backend is started via `docker-compose.dev.yml`; this avoids file-watching/polling issues in bind mounts
- Profiles page responses should be normalized defensively before rendering; avoid assuming `/api/child-profiles` always returns a bare array in every environment.

When changing route behavior, auth flow, or dashboard/book lifecycle logic, update or add frontend specs near the affected route/component.
