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
| Container | Docker, Colima (macOS) |

## Prerequisites

- **Node.js** 20+ (for local development without Docker)
- **Docker** + **Colima** (macOS) or Docker Desktop
- **pnpm** 9+ (or npm 10+)

```bash
# macOS with Colima
brew install colima docker docker-compose
colima start --cpu 4 --memory 8 --disk 60  # adjust as needed
```

## Quick Start (Docker / Colima)

### Development (hot-reload)

```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend

# Stop
docker compose -f docker-compose.dev.yml down
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production-like (standalone build)

```bash
docker compose up -d --build
```

## Local Development (without Docker)

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database (requires running Postgres)
npm run db:push

# Start all workspaces in watch mode
npm run dev
```

Individual workspace commands:

```bash
# Backend only
npm run start:dev --workspace=apps/backend

# Frontend only
npm run dev --workspace=apps/frontend

# Database package
npm run generate --workspace=packages/database
```

## Available Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all workspaces in watch mode (Turborepo) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type-check all workspaces |
| `npm run test` | Run tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate:dev` | Run Prisma migrations (dev) |
| `npm run db:push` | Push schema without migration |
| `npm run format` | Format with Prettier |

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
DATABASE_URL=postgresql://user:password@localhost:5432/aibook?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
MOCK_AUTH=true
# Add LLM provider keys as needed
```

### apps/frontend/.env.local
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
- Bind mounts source code for hot-reload
- Runs `npm install` and dev commands in containers
- Uses `node:24-slim` for faster startup

### Colima Configuration
Default Colima VM uses `~/.colima/default/`. For external volumes (e.g., `/Volumes/KIOXIA`):
```bash
colima start --mount /Volumes/KIOXIA:/Volumes/KIOXIA --cpu 4 --memory 8 --disk 60
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port conflicts | Ensure 3000, 3001, 5432, 6379 are free |
| Prisma client out of date | Run `npm run db:generate` |
| Docker build fails | Check `.dockerignore` excludes `node_modules` |
| Colima disk full | `colima delete && colima start --disk 100` |
| Frontend can't reach backend | Verify `BACKEND_URL` in frontend env |

## License

Private project — internal use only.