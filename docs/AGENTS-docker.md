# Docker

## Commands

```bash
# Production-like standalone build (all services in Docker)
docker compose up -d --build

# Development: DB, Redis, MinIO, and Backend in Docker; frontend runs locally
docker compose -f docker-compose.dev.yml up -d
npm run dev --workspace=apps/frontend
```

## Compose Files

- `docker-compose.yml` — production-like standalone build path (multi-stage Dockerfiles)
- `docker-compose.dev.yml` — backend, PostgreSQL, Redis, MinIO, and a one-shot
  MinIO bucket initializer; frontend runs locally

Both files start:

| Service | Port(s) | Notes |
|---------|---------|-------|
| `db` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 |
| `minio` | 9000 (API), 9001 (console) | `elestio/minio` image, `minioadmin` / `minioadmin` |
| `minio-init` | — | `bitnamilegacy/minio-client`; creates the `aibook` bucket and sets public-read |
| `backend` | 3001 | depends on the services above |
| `frontend` | 3000 | production compose only |

The official `minio/minio` Docker Hub image is not always pullable. The compose files
use maintained mirrors; pin specific digests/tags for production.

The `aibook` bucket is public-read so a browser can open `pdfUrl`. Replace this
with private objects plus signed URLs before production.

## Environment Variables

- `apps/backend/.env` is required; start from `apps/backend/.env.example`.
- Production compose does not run migrations automatically; apply the Prisma schema
  before starting it.
- LLM variables are required by env validation:
  `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL_NAME`, `LLM_DEFAULT_PROMPT`.
  `LLM_MODELS` is an optional comma-separated Settings allowlist.
- Compose overrides MinIO values for the container:
  `S3_ENDPOINT=http://minio:9000`, `S3_PUBLIC_URL=http://localhost:9000`,
  `S3_BUCKET=aibook`.
- `S3_ENDPOINT` is container-facing; `S3_PUBLIC_URL` is browser-facing.
- Frontend connects to `http://localhost:3001` locally via `BACKEND_URL`.

## Dockerfiles

- `Dockerfile.backend` — Node 26 Alpine, multi-stage (builder + runner),
  production dependencies only, runs as `node` (non-root). The runner copies
  workspace manifests before `npm prune` so hoisted Nest packages survive pruning.
- `Dockerfile.frontend` — Node 26 Alpine, multi-stage with Next.js standalone
  output, runs as `node` (non-root).

## Health

`GET /health` returns `{ "status": "ok" }`. The Docker test workflow waits for it
before considering the backend container healthy.

## Docker Desktop (macOS)

Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).
It includes Docker Engine, Docker Compose, and a GUI.

## CI/CD (GitHub Actions)

### CD Pipeline (`.github/workflows/cd.yml`)

On push to `main`:
- Builds backend and frontend images with `docker build` (single-arch)
- Pushes to GHCR: `ghcr.io/<owner>/aiBook/backend`, `ghcr.io/<owner>/aiBook/frontend`
- Tags: `sha-<full-sha>`, `latest`
- Trivy vulnerability scan (HIGH/CRITICAL) → SARIF upload to GitHub Security tab
- SBOM generation (SPDX JSON) via Anchore Syft → artifact upload (90-day retention)

### Docker Test Workflow (`.github/workflows/docker-test.yml`)

Trigger: manual (`workflow_dispatch`) or PR label `docker-test`
- Starts PostgreSQL and Redis service containers
- Builds both Dockerfiles locally (`load: true`)
- Runs the backend with test LLM env values and polls `GET /health`
- Runs the frontend container and checks that it serves HTTP

### Security

- Base images: `node:26-alpine`
- Multi-stage builds: no dev dependencies in the runner stage
- Backend and frontend run as the non-root `node` user
- Trivy scan on every CD run
- SBOM for supply-chain transparency
- `npm audit` gate runs at `high` severity; moderate transitive findings
  remain and are tracked as follow-up work
