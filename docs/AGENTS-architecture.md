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
├── docker-compose.dev.yml        # Backend, PostgreSQL, Redis, MinIO
├── Dockerfile.backend
├── Dockerfile.frontend
└── .dockerignore
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | NestJS 10, Prisma ORM, BullMQ, PostgreSQL, Redis, class-validator |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Database | PostgreSQL 16, Prisma 7 (PostgreSQL driver adapter) |
| Queue | BullMQ / Redis |
| Object storage | MinIO (S3-compatible) |
| PDF | PDFKit, generated on demand and stored in MinIO |
| Auth | Mock (transitional) — backend `MockAuthGuard`, frontend `AuthProvider` |
| Linting | oxlint (multi-workspace config) |
| Formatting | oxfmt |
| Container | Docker Desktop |

## API Communication

Frontend API calls go through `apps/frontend/next.config.mjs`, which rewrites
`/api/:path*` to `BACKEND_URL`. In Docker the default is `http://backend:3001`;
locally it is `http://localhost:3001`.

## Turborepo Commands

| Scope | Command | Notes |
|-------|---------|-------|
| Root | `npm run dev` | `turbo run dev` — currently the frontend only (backend has no `dev` task) |
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
| `apps/frontend` | `npm run test:e2e` | Playwright smoke test with stubbed API |
| `packages/database` | `npm run generate` | `prisma generate` |
| `packages/database` | `npm run migrate:dev` | Prisma dev migration |
| `packages/database` | `npm run db:push` | Push schema without migration |

## CI/CD Architecture

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to any branch | Lint, typecheck, tests, build, dependency audit |
| `cd.yml` | Push to `main` | Build & push Docker images to GHCR, Trivy scan, SBOM |
| `docker-test.yml` | Manual / PR label `docker-test` | Validate Docker builds and `/health` startup |
| `pr-checks.yml` | PR opened/updated | Conventional commits, PR size, required labels |

### CI Pipeline (`ci.yml`)

**Parallel jobs:**

- `lint` — oxlint + oxfmt check
- `typecheck` — TypeScript strict mode
- `test-backend` — Jest with PostgreSQL 16 + Redis 7 services
- `test-frontend` — Vitest
- `test-e2e` — Playwright after a full build; the current test stubs `/api/*` and
  does not start the backend or exercise real generation
- `build` — Turbo build (all workspaces)
- `security-audit` — `npm audit --audit-level=critical`
- `deps-check` — `npm outdated` (warn only)

**Caching:** npm cache + Turbo cache

**Node:** 24 (from `.nvmrc`)

### CD Pipeline (`cd.yml`)

- Builds single-arch images with `docker build` and pushes to GHCR
- Tags: `sha-<full-sha>`, `latest` (main only)
- Trivy scan for HIGH/CRITICAL findings, SARIF upload to GitHub Security
- Anchore Syft SBOM in SPDX JSON (90-day artifact retention)
- Layer caching is provided by the GitHub Actions runner (Docker build cache);
  the workflow does not use Buildx multi-arch builds

### Security

- Dependency audit on every CI run at `critical` severity
- Container vulnerability scan (Trivy) on every CD run
- SBOM generation for supply-chain transparency
- Docker images run as the non-root `node` user
- The audit still reports `high` and `moderate` findings in transitive tooling
  dependencies. Upgrading NestJS 10 to 12, Prisma, and the CLI toolchain is tracked
  as follow-up work.
