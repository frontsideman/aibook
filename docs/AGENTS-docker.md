# Docker

## Commands

```bash
# Production-like standalone build (all services in Docker)
docker compose up

# Development: DB, Redis, and Backend in Docker; frontend runs locally
docker compose -f docker-compose.dev.yml up -d
npm run dev --workspace=apps/frontend
```

## Compose Files

- `docker-compose.yml` — production-like standalone build path (multi-stage Dockerfiles)
- `docker-compose.dev.yml` — Docker-only backend path; frontend runs locally to avoid Docker file-watch polling

## Environment Variables

- `apps/backend/.env` uses Docker service names by default (`db`, `redis`)
- Backend runs only in Docker; local backend execution is not supported
- Frontend connects to `http://localhost:3001` via `apps/frontend/.env.example`

## Dockerfiles

- `Dockerfile.backend` — targets Node 24 Alpine, multi-stage (builder + runner)
- `Dockerfile.frontend` — targets Node 24 Alpine, multi-stage with Next.js standalone output

## Docker Desktop (macOS)

Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/). It includes the Docker Engine, Docker Compose, and a GUI for managing containers.

## CI/CD (GitHub Actions)

### CD Pipeline (`.github/workflows/cd.yml`)

On push to `main`:
- Builds multi-arch images (`linux/amd64`, `linux/arm64`) for backend & frontend
- Pushes to GHCR: `ghcr.io/<owner>/aiBook/backend`, `ghcr.io/<owner>/aiBook/frontend`
- Tags: `sha-<short-sha>`, `latest`
- Trivy vulnerability scan (HIGH/CRITICAL) → SARIF upload to GitHub Security tab
- SBOM generation (SPDX JSON) via Anchore Syft → artifact upload (90-day retention)
- Layer caching via GitHub Actions cache (`type=gha`)

### Docker Test Workflow (`.github/workflows/docker-test.yml`)

Trigger: manual (`workflow_dispatch`) or PR label `docker-test`
- Builds both Dockerfiles locally (`load: true`)
- Runs containers with health checks
- Verifies startup on ports 3000/3001

### Security

- Base images: `node:24-alpine` (minimal attack surface)
- Multi-stage builds: no dev dependencies in runner stage
- Non-root user in runner stage (Node default)
- Trivy scan on every CD run
- SBOM for supply chain transparency
