# Quick Reference — Commands

## Root (Turborepo)

| Command | Description |
|---------|-------------|
| `npm run dev` | `turbo run dev` — currently starts the frontend only |
| `npm run build` | `turbo run build` — build all workspaces |
| `npm run lint` | `turbo run lint` — lint all workspaces |
| `npm run typecheck` | `turbo run typecheck` — type-check all workspaces |
| `npm run test` | `turbo run test` — run all tests |
| `npm run db:generate` | Prisma generate in `packages/database` |
| `npm run db:migrate:dev` | Prisma migrate dev in `packages/database` |
| `npm run db:push` | Prisma db push in `packages/database` |
| `npm run lint:fix` | `turbo run lint:fix` — auto-fix lint issues |
| `npm run format` | oxfmt on `*.{ts,tsx,js,jsx,json}` |
| `npm run format:check` | Check formatting with oxfmt |

## Backend (`apps/backend`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Nest watch mode |
| `npm run test` | Jest (`src/**/*.spec.ts`) |
| `npm run test:cov` | Jest with coverage |
| `npm run build` | `nest build` |

There is no backend `test:e2e` script.

## Frontend (`apps/frontend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Next.js production build |
| `npm run start` | Next.js production server |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright smoke test with stubbed API (`PLAYWRIGHT_PORT=3100` if 3000 is busy) |

## Database (`packages/database`)

| Command | Description |
|---------|-------------|
| `npm run generate` | `prisma generate` |
| `npm run migrate:dev` | Prisma dev migration |
| `npm run db:push` | Push schema without migration |
| `npm run seed` | Seed the story library |

## Docker

| Command | Description |
|---------|-------------|
| `docker compose up -d --build` | Production-like build |
| `docker compose -f docker-compose.dev.yml up -d` | Start backend/db/redis/minio for local frontend dev |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f <service>` | Follow logs for a service |

## Health

| Command | Description |
|---------|-------------|
| `curl http://localhost:3001/health` | Backend liveness check |

## MinIO

| Action | URL / Credentials |
|--------|-------------------|
| API | http://localhost:9000 |
| Console | http://localhost:9001 |
| Credentials | `minioadmin` / `minioadmin` |
| Bucket | `aibook` (public-read in Docker) |

## Frontend Dev

| Command | Description |
|---------|-------------|
| `npm run dev --workspace=apps/frontend` | Run Next.js locally for reliable file watching |

## CI/CD (GitHub Actions)

| Command | Description |
|---------|-------------|
| `gh workflow run ci.yml` | Trigger CI manually |
| `gh workflow run cd.yml` | Trigger CD manually (main branch only) |
| `gh workflow run docker-test.yml` | Trigger Docker build test manually |
| `gh run list --workflow=ci.yml` | List CI runs |
| `gh run view --log` | View latest run logs |
| `gh run watch` | Watch running workflow |

## Security

| Command | Description |
|---------|-------------|
| `npm audit --audit-level=critical` | CI gate |
| `npm audit --audit-level=high` | Show high/critical findings (currently non-blocking) |
| `npm outdated --all` | List all outdated dependencies |
| `trivy image <image>` | Scan a Docker image for vulnerabilities |
