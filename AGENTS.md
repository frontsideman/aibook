# Children's Book SaaS — Agent Guide

## Architecture

Monorepo (npm workspaces + Turbo):

- `apps/backend` — NestJS (ESM source/CJS build, port 3001)
- `apps/frontend` — Next.js 16 (ESM, port 3000, `output: "standalone"`)
- `packages/database` — Prisma 7.x (`@repo/database`, ESM/TS)

`next.config.mjs` rewrites `/api/*` to `BACKEND_URL`. Frontend calls e.g. `/api/books`.

## Database (`packages/database`)

Prisma 7.x uses **driver adapters** (`@prisma/adapter-pg` + `pg` pool), not the legacy binary/query engine. Client is created via `createPrismaClient()` factory in `index.ts`. Undici polyfills fetch for Prisma.

Run `npm run generate` (alias for `prisma generate`) from `packages/database/` after schema changes. Backend imports `@repo/database` via tsconfig paths.

Schema enums: `BookStatus`, `BookType`, `BookStyle` — use these, not raw strings.

## Commands

| Scope | Command | Notes |
|-------|---------|-------|
| Root | `npm run build` | `turbo run build` |
| Root | `npm run dev` | `turbo run dev` (persistent, hot-reloading in Docker dev) |
| Root | `npm run lint` | `turbo run lint` |
| Root | `npm run format` | Prettier on `*.{ts,tsx,md}` |
| `apps/backend` | `npm run test` | Jest, `*.spec.ts` in `src/` |
| `apps/backend` | `npm run start:dev` | `nest start --watch` |
| `packages/database` | `npm run generate` | `prisma generate` |

Turbo builds run `build` on dependencies first (e.g., database → backend).

## Key Features & Hardening

- **Mock Auth**: Backend has `MockAuthGuard` enabled via `MOCK_AUTH='true'`. It injects a mock user into requests for development.
- **Queue Management**: Shared `QueueModule` (`apps/backend/src/queue/`) centralizes BullMQ registrations.
- **Database Integrity**: Prisma schema includes `@@unique([bookId, pageNumber])` and mandatory `onDelete: Cascade` on all relations.
- **PDF Generation**: Sequential async loop in `PdfService` handles image fetching and streaming safely.
- **Docker Dev Mode**: `docker-compose.dev.yml` supports hot-reloading with host volumes.

## Key Quirks

- `storage.service.ts` falls back to `'minioadmin'` credentials when env vars unset (local dev only)
- `child-profile.controller.ts` and `BookController` are protected by `MockAuthGuard`.
- `PrismaClient` must be explicitly disconnected on application shutdown via `onModuleDestroy` in `PrismaService`.

## Docker

```bash
docker compose up               # Production-like build (standalone)
docker compose -f docker-compose.dev.yml up  # Dev mode with hot-reloading
```

`Dockerfile.backend`: Node 24 Alpine, `turbo run build --filter=backend...`
`Dockerfile.frontend`: Node 24 Alpine, Next.js `standalone` output.

## Tailwind CSS

`globals.css` uses `@tailwind` directives (v3 syntax), but no `tailwindcss`/`postcss` packages are installed. Next.js 16 ships with built-in Tailwind v4 support, which uses `@import "tailwindcss"`. This is a known mismatch — fix if CSS changes are needed.

## Testing

- Backend: Jest with `ts-jest`. Tests in `src/`. MSW not used in backend.
- Frontend: Vitest + Testing Library are configured. Tests live in `src/**/*.spec.ts(x)`.
- Frontend: Uses MSW (`src/mocks/`) for API mocking.
- Frontend auth flow currently has coverage for mock session storage, provider state, route guards, and auth pages.
- No committed e2e suite yet, but Playwright is installed and can be used for local smoke-checks.

## Project State

Prototype stage. Mock Auth implemented, Core generation logic stable, Docker setup complete. Prisma migration flow requires `prisma db push` or manual migrations.

Frontend auth currently uses a local mock session in `localStorage` with guarded `(auth)` and `(app)` route groups. Follow-up auth work is tracked in `backlog.md`.

## Git

Use git naming convention https://www.conventionalcommits.org/en/v1.0.0/ for every commit
