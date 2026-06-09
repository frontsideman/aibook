# Quick Reference — Commands

## Root (Turborepo)

| Command | Description |
|---------|-------------|
| `npm run dev` | `turbo run dev` — start all workspaces in watch mode |
| `npm run build` | `turbo run build` — build all workspaces |
| `npm run lint` | `turbo run lint` — lint all workspaces |
| `npm run typecheck` | `turbo run typecheck` — type-check all workspaces |
| `npm run test` | `turbo run test` — run all tests |
| `npm run db:generate` | Prisma generate in `packages/database` |
| `npm run db:migrate:dev` | Prisma migrate dev in `packages/database` |
| `npm run db:push` | Prisma db push in `packages/database` |
| `npm run lint:fix` | `turbo run lint:fix` — auto-fix lint issues |
| `npm run format` | oxfmt on `*.{ts,tsx,js,jsx,json}` |

## Backend (`apps/backend`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Nest watch mode |
| `npm run test` | Jest (`src/**/*.spec.ts`) |
| `npm run test:e2e` | Jest e2e tests |

## Frontend (`apps/frontend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev with Turbopack |
| `npm run build` | Next.js production build |
| `npm run start` | Next.js production server |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |

## Database (`packages/database`)

| Command | Description |
|---------|-------------|
| `npm run generate` | `prisma generate` |
| `npm run migrate:dev` | Prisma dev migration |
| `npm run db:push` | Push schema without migration |
| `npm run seed` | Seed database |

## Docker

| Command | Description |
|---------|-------------|
| `docker compose up` | Production-like standalone build |
| `docker compose -f docker-compose.dev.yml up -d` | Start backend/db/redis for local frontend dev |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f <service>` | Follow logs for service |

## Docker Desktop (macOS)

| Action | Description |
|--------|-------------|
| Open Docker Desktop app | Starts Docker Engine |
| Quit Docker Desktop | Stops Docker Engine |

## Frontend Dev

| Command | Description |
|---------|-------------|
| `npm run dev --workspace=apps/frontend` | Run Next.js locally for reliable file watching |
