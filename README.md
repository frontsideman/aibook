# aiBook — Children's Book SaaS

Monorepo with npm workspaces and Turborepo.

## Architecture

```
aiBook/
├── apps/
│   ├── backend/          # NestJS API (port 3001)
│   └── frontend/         # Next.js 16 app (port 3000)
├── packages/
│   └── database/         # Shared Prisma package (@repo/database)
├── docker-compose.yml            # Production-like standalone build
├── docker-compose.dev.yml        # Hot-reload development
├── Dockerfile.backend
├── Dockerfile.frontend
└── .dockerignore
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| API | NestJS, Prisma ORM, BullMQ, PostgreSQL, Redis |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Turbopack |
| Database | PostgreSQL 16, Prisma 7 (PostgreSQL adapter) |
| Queue | BullMQ / Redis |
| Auth | Mock (transitional) — backend `MockAuthGuard`, frontend `AuthProvider` |
| Container | Docker Desktop |

## Prerequisites

- **Node.js** 20+ (for frontend local development and npm scripts)
- **Docker Desktop**
- **pnpm** 9+ (or npm 10+)

```bash
# macOS: install Docker Desktop from https://www.docker.com/products/docker-desktop/
```

## Quick Start (Docker)

### Development (hot-reload)

```bash
# Start backend, DB, and Redis in Docker
docker compose -f docker-compose.dev.yml up -d

# Start the frontend locally
npm run dev --workspace=apps/frontend

# View backend logs
docker compose -f docker-compose.dev.yml logs -f backend

# Stop the Docker services
docker compose -f docker-compose.dev.yml down
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL (Docker service): `db:5432`
- Redis (Docker service): `redis:6379`

### Production-like (standalone build)

```bash
docker compose up -d --build
```

## Local Development

The backend runs only in Docker. The frontend runs locally on your machine.

```bash
# Start DB, Redis, and Backend in Docker
docker compose -f docker-compose.dev.yml up -d

# Start the frontend locally
npm run dev --workspace=apps/frontend

# View backend logs
docker compose -f docker-compose.dev.yml logs -f backend

# Stop the Docker services
docker compose -f docker-compose.dev.yml down
```

Individual workspace commands:

```bash
# Frontend only
npm run dev --workspace=apps/frontend

# Database package (connects to Docker PostgreSQL)
npm run generate --workspace=packages/database
```

## Available Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend workspace in watch mode (Turborepo) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type-check all workspaces |
| `npm run test` | Run tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate:dev` | Run Prisma migrations (dev) |
| `npm run db:push` | Push schema without migration |
| `npm run format` | Format with oxfmt |

## Project Structure Details

### apps/backend
- NestJS modular architecture
- Modules: `book`, `book-generation`, `settings`, `child-profile`, `story-library`, `payment`, `pdf`, `storage`, `queue`, `ai`
- Prisma client from `@repo/database`
- BullMQ workers for background generation jobs

### apps/frontend
- Next.js 16 with App Router
- Route groups: `(auth)` for login/signup, `(app)` for authenticated pages
- Key routes: `/` (dashboard), `/books/new`, `/books/[id]`, `/profiles`, `/settings`
- API calls proxied via `next.config.mjs` rewrite to `BACKEND_URL`

### packages/database
- Prisma schema: `prisma/schema.prisma`
- Shared enums: `BookStatus`, `BookType`, `BookStyle`, `ReasoningEffort`, `Tone`
- Exports Prisma client via `createPrismaClient()`
- Published internally as `@repo/database`

## Environment Variables

### apps/backend/.env
```env
DATABASE_URL=postgresql://user:password@db:5432/aibook?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3001
MOCK_AUTH=true
# Add LLM provider keys as needed
```

### apps/frontend/.env.example
```env
BACKEND_URL=http://localhost:3001
```

## Database

```bash
# Generate client after schema changes
npm run db:generate

# Create and run migration
npm run db:migrate:dev

# Push schema directly (dev only)
npm run db:push

# Seed database
npm run seed --workspace=packages/database
```

## Testing

```bash
# Backend (Jest)
npm run test --workspace=apps/backend

# Frontend (Vitest)
npm run test --workspace=apps/frontend

# Frontend E2E (Playwright)
npm run test:e2e --workspace=apps/frontend
```

## Docker Details

### docker-compose.yml (Production-like)
- Multi-stage Dockerfiles (`Dockerfile.backend`, `Dockerfile.frontend`)
- Builds standalone Next.js output
- Uses `node:24-alpine` base images

### docker-compose.dev.yml (Development)
- Runs backend, PostgreSQL, and Redis in containers
- Frontend runs locally with `npm run dev --workspace=apps/frontend`
- Keeps polling-sensitive Next.js file watching out of Docker bind mounts

### Docker Desktop (macOS)
Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port conflicts | Ensure 3000, 3001, 5432, 6379 are free |
| Prisma client out of date | Run `npm run db:generate` |
| Docker build fails | Check `.dockerignore` excludes `node_modules` |
| Docker Desktop won't start | Restart the app or run `killall Docker` then reopen Docker Desktop |
| Frontend file watching is flaky in Docker | Run `npm run dev --workspace=apps/frontend` locally and keep only backend/db/redis in Docker |
| Frontend can't reach backend | Verify `BACKEND_URL` in frontend env |

## License

Private project — internal use only.
