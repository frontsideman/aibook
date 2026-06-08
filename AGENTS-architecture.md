# Architecture

## Monorepo Structure

```
aiBook/
├── apps/
│   ├── backend/          # NestJS API on port 3001
│   └── frontend/         # Next.js 16 app on port 3000 (output: standalone)
├── packages/
│   └── database/         # Shared Prisma package (@repo/database)
├── docker-compose.yml            # Production-like standalone build
├── docker-compose.dev.yml        # Hot-reload development
├── Dockerfile.backend
├── Dockerfile.frontend
└── .dockerignore
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | NestJS, Prisma ORM, BullMQ, PostgreSQL, Redis |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Turbopack |
| Database | PostgreSQL 16, Prisma 7 (PostgreSQL adapter) |
| Queue | BullMQ / Redis |
| Auth | Mock (transitional) — backend `MockAuthGuard`, frontend `AuthProvider` |
| Container | Docker, Colima (macOS) |

## API Communication

Frontend API calls go through `apps/frontend/next.config.mjs`, which rewrites `/api/:path*` to `BACKEND_URL`.

## Turborepo Commands

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

Turbo `build` depends on upstream package builds first.

## Workspace Commands

| Workspace | Command | Description |
|-----------|---------|-------------|
| `apps/backend` | `npm run start:dev` | Nest watch mode |
| `apps/backend` | `npm run test` | Jest, `src/**/*.spec.ts` |
| `apps/frontend` | `npm run test` | Vitest |
| `apps/frontend` | `npm run test:e2e` | Playwright |
| `packages/database` | `npm run generate` | `prisma generate` |
| `packages/database` | `npm run migrate:dev` | Prisma dev migration |
| `packages/database` | `npm run db:push` | Push schema without migration |