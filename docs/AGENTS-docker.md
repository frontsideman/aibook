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
