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
| Linting | oxlint (multi-workspace config) |
| Formatting | oxfmt |
| Container | Docker Desktop |

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
| Root | `npm run lint:fix` | `turbo run lint:fix` — auto-fix lint issues |
| Root | `npm run format` | oxfmt on `*.{ts,tsx,js,jsx,json}` |

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

## CI/CD Architecture

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to any branch | Lint, typecheck, test (unit + E2E), build, security audit |
| `cd.yml` | Push to `main` | Build & push multi-arch Docker images to GHCR, Trivy scan, SBOM |
| `docker-test.yml` | Manual / PR label `docker-test` | Validate Docker builds & container startup |
| `pr-checks.yml` | PR opened/updated | Conventional commits, PR size, required labels |

### CI Pipeline (`ci.yml`)

**Parallel Jobs:**
- `lint` — oxlint + oxfmt check
- `typecheck` — TypeScript strict mode
- `test-backend` — Jest with PostgreSQL 16 + Redis 7 services
- `test-frontend` — Vitest
- `test-e2e` — Playwright (Chromium) after full build
- `build` — Turbo build (all workspaces)
- `security-audit` — `npm audit --audit-level=high`
- `deps-check` — `npm outdated --all` (warn only)

**Caching:** npm cache + Turbo remote cache (`.turbo`)

**Node:** 24 LTS (from `.nvmrc`)

### CD Pipeline (`cd.yml`)

**Jobs (parallel):**
- `build-backend` — Docker Buildx → GHCR → Trivy scan (SARIF)
- `build-frontend` — Docker Buildx → GHCR → Trivy scan (SARIF)
- `sbom` — Anchore Syft → SPDX JSON artifacts (90-day retention)

**Image Tags:** `sha-<short-sha>`, `latest` (main only)

**Platforms:** `linux/amd64`, `linux/arm64`

**Cache:** GitHub Actions cache (`type=gha`)

### Security

- Dependency audit on every CI run
- Container vulnerability scan (Trivy) on every CD run
- SBOM generation for supply chain transparency
- SARIF upload to GitHub Security tab for visibility
