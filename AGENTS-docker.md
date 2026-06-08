# Docker

## Commands

```bash
# Production-like standalone build
docker compose up

# Hot-reload development
docker compose -f docker-compose.dev.yml up
```

## Compose Files

- `docker-compose.yml` — production-like standalone build path (multi-stage Dockerfiles)
- `docker-compose.dev.yml` — hot-reload development path (bind mounts, `npm install` in container)

## Dockerfiles

- `Dockerfile.backend` — targets Node 24 Alpine, multi-stage (builder + runner)
- `Dockerfile.frontend` — targets Node 24 Alpine, multi-stage with Next.js standalone output

## Colima Configuration (macOS)

Default Colima VM uses `~/.colima/default/`. For external volumes (e.g., `/Volumes/KIOXIA`):

```bash
colima start --mount /Volumes/KIOXIA:/Volumes/KIOXIA --cpu 4 --memory 8 --disk 60
```

Data path: `LIMA_HOME="/Volumes/KIOXIA/Colima/colima_data"`