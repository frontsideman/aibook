# Children's Book SaaS — Agent Guide

## Architecture

Monorepo with npm workspaces and Turbo:

- `apps/backend` — NestJS API on port `3001`
- `apps/frontend` — Next.js 16 app on port `3000` with `output: "standalone"`
- `packages/database` — shared Prisma package published internally as `@repo/database`

Frontend API calls go through `apps/frontend/next.config.mjs`, which rewrites `/api/:path*` to `BACKEND_URL`.

## Commands

| Scope | Command | Notes |
|-------|---------|-------|
| Root | `npm run dev` | `turbo run dev` |
| Root | `npm run build` | `turbo run build` |
| Root | `npm run lint` | `turbo run lint` |
| Root | `npm run typecheck` | `turbo run typecheck` |
| Root | `npm run test` | `turbo run test` |
| Root | `npm run db:generate` | Runs Prisma generate in `packages/database` |
| Root | `npm run db:migrate:dev` | Runs `prisma migrate dev` in `packages/database` |
| Root | `npm run db:push` | Runs `prisma db push` in `packages/database` |
| Root | `npm run format` | Prettier on `*.{ts,tsx,md}` |
| `apps/backend` | `npm run start:dev` | Nest watch mode |
| `apps/backend` | `npm run test` | Jest, `src/**/*.spec.ts` |
| `apps/frontend` | `npm run test` | Vitest |
| `apps/frontend` | `npm run test:e2e` | Playwright |
| `packages/database` | `npm run generate` | `prisma generate` |
| `packages/database` | `npm run migrate:dev` | Prisma dev migration |
| `packages/database` | `npm run db:push` | Push schema without migration |

Turbo `build` depends on upstream package builds first.

## Database

Prisma lives in `packages/database/prisma/schema.prisma`.

- Prisma 7 uses the `@prisma/adapter-pg` driver adapter, not the legacy query engine flow.
- The shared client is created via `createPrismaClient()` in `packages/database/index.ts`.
- Run `npm run generate` in `packages/database` after schema changes.
- Backend code imports Prisma types and enums from `@repo/database`.

Current schema enums used across the app:

- `BookStatus`
- `BookType`
- `BookStyle`
- `ReasoningEffort`
- `Tone`

Use Prisma enums instead of raw strings whenever types are available.

Important data rules already encoded in schema:

- `Page` has `@@unique([bookId, pageNumber])`
- All core relations use `onDelete: Cascade`
- `User` stores default generation preferences via `preferredLlmModel` and `preferredReasoningEffort`

## Frontend Routes

Authenticated app routes live under `apps/frontend/src/app/(app)/`:

- `/` — dashboard and library filters
- `/books/new` — create flow
- `/books/[id]` — detail route that redirects by book status
- `/books/[id]/generating` — polling/loading state
- `/books/[id]/preview` — review and approval flow
- `/profiles` — child profiles
- `/settings` — generation settings

Auth-facing routes live under `apps/frontend/src/app/(auth)/`:

- `/login`
- `/signup`

There is also `/logout`, which clears the current frontend mock session.

## Routing Rules

Breadcrumbs are generated from `navItems` plus pathname fallback in `PageBreadcrumb.tsx`.

When adding a page under `apps/frontend/src/app/(app)/`:

- add a matching `navItems` entry in `apps/frontend/src/components/app-shell/nav-items.ts` if it belongs in sidebar navigation
- keep breadcrumb labels aligned with the `navItems` label when possible
- preserve the existing status-based routing for `/books/[id]`

`/books/[id]` is not a normal detail page entry point. It redirects:

- `DRAFT`, `GENERATING`, `FAILED` -> `/books/[id]/generating`
- `REVIEW` -> `/books/[id]/preview`
- completed books stay on the detail page

If you touch this flow, update the corresponding route tests.

## Backend Features

Current backend modules include:

- `book` — list, create, preview, edit, regenerate, approve, PDF lookup
- `book-generation` — BullMQ worker/processor for generation jobs
- `settings` — generation defaults for new books
- `child-profile`
- `story-library`
- `payment`
- `pdf`
- `storage`
- `queue`
- `ai`

Current book HTTP surface in `BookController`:

- `GET /books`
- `POST /books/generate`
- `GET /books/:id`
- `GET /books/:id/preview`
- `PATCH /books/:id/pages/:pageNumber`
- `PATCH /books/:id/regenerate`
- `POST /books/:id/approve`
- `GET /books/:id/pdf`

Generation settings HTTP surface:

- `GET /settings/generation`
- `PATCH /settings/generation`

## Current Product State

The app is still a prototype, but the current flow is more advanced than the original scaffold:

- New books are created with user-level generation defaults and queued for background generation.
- The frontend has explicit generating, review, failed, and completed states in the book flow.
- Review/approval is part of the main flow before a book becomes `COMPLETED`.
- PDF access is a separate backend lookup once a completed book has a stored `pdfUrl`.

## Auth State

Auth is transitional and split between backend and frontend concerns:

- Backend development mode relies on `MockAuthGuard`, which injects a mock user for protected controllers.
- Frontend still has a local mock auth/session layer in `AuthProvider`, `AuthGuard`, and `src/lib/mock-auth.ts`.
- `(auth)` and `(app)` route groups are currently enforced by that frontend mock session state.

Do not document auth as finished or real-session-backed. The intended direction is tracked in `backlog.md`: remove frontend mock auth and make the backend the source of truth.

## Key Quirks

- `StorageService` falls back to `minioadmin` credentials when related env vars are unset. Treat that as local-dev-only behavior.
- `MockAuthGuard` currently protects books, child profiles, story library, and settings endpoints.
- `SubscriptionGuard` currently checks a `user-email` request header for prototype subscription gating.
- `PrismaService` must disconnect explicitly on shutdown via `onModuleDestroy`.

## Styling

Frontend global styles are in `apps/frontend/src/app/globals.css`.

- Tailwind v4-style `@import "tailwindcss";` is already in use.
- Design tokens and theme variables are defined directly in `globals.css`.
- The app uses `next/font` with `Inter`, `Newsreader`, and `IBM Plex Mono`.

Preserve the established visual language unless the task is explicitly a redesign.

## Testing

- Backend uses Jest with `ts-jest`
- Frontend uses Vitest and Testing Library
- Runtime MSW-backed API mocking has been removed; the frontend talks to the backend directly via `/api/*` rewrites, and tests mock `fetch` or exercise the backend responses explicitly
- Playwright is installed and exposed through `apps/frontend` via `npm run test:e2e`

When changing route behavior, auth flow, or dashboard/book lifecycle logic, update or add frontend specs near the affected route/component.

## Docker

```bash
docker compose up
docker compose -f docker-compose.dev.yml up
```

- `docker-compose.yml` is the production-like standalone build path
- `docker-compose.dev.yml` is the hot-reload development path
- `Dockerfile.backend` and `Dockerfile.frontend` target Node 24 Alpine

## Docs

Planning and design artifacts live under `docs/superpowers/`.

- `specs/` holds design docs
- `plans/` holds implementation plans

Recent docs already cover the current auth and book-creation direction. Check those before inventing new patterns for the same area.

## Git

Use Conventional Commits for every commit:

- https://www.conventionalcommits.org/en/v1.0.0/

Group logically related changes together. Avoid mixing unrelated frontend, backend, and docs work in the same commit unless they are part of one cohesive change.
