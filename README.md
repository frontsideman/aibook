# aiBook — Children's Book SaaS

Monorepo with npm workspaces and Turborepo. The current product slice is a text-only
book flow: create a child profile, pick a story and style, generate a book in the
background, review and edit it, approve it, then download a PDF.

## Architecture

```
aiBook/
├── apps/
│   ├── backend/          # NestJS API (port 3001)
│   └── frontend/         # Next.js app (port 3000)
├── packages/
│   └── database/         # Shared Prisma package (@repo/database)
├── docker-compose.yml            # Production-like standalone build
├── docker-compose.dev.yml        # Backend, PostgreSQL, Redis, MinIO
├── Dockerfile.backend
├── Dockerfile.frontend
└── .dockerignore
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 26 |
| API | NestJS 12, Prisma ORM, BullMQ, PostgreSQL, Redis, class-validator |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Database | PostgreSQL 16, Prisma 7 (PostgreSQL driver adapter) |
| Queue | BullMQ / Redis |
| Object storage | MinIO locally (S3-compatible API) |
| PDF | PDFKit, generated on demand and stored in MinIO |
| Auth | Mock (transitional) — backend `MockAuthGuard`, frontend local session |
| Container | Docker Desktop |

## Prerequisites

- **Node.js 26** (see `.nvmrc`)
- **npm 11** (see `packageManager` in `package.json`)
- **Docker Desktop**

```bash
# macOS: install Docker Desktop from https://www.docker.com/products/docker-desktop/
```

## Quick Start (Docker)

### 1. Configure the backend environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Fill in `LLM_API_KEY`. The example points at DeepSeek:
`LLM_API_URL=https://api.deepseek.com/chat/completions`, `LLM_MODEL_NAME=deepseek-flash`.

### 2. Development (hot-reload)

```bash
# Start PostgreSQL, Redis, MinIO, and the backend in Docker
docker compose -f docker-compose.dev.yml up -d

# Start the frontend locally
npm run dev --workspace=apps/frontend

# View backend logs
docker compose -f docker-compose.dev.yml logs -f backend

# Stop the Docker services
docker compose -f docker-compose.dev.yml down
```

The first backend start runs `npm install`, Prisma generate/push, and the story seed.

**Access:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Backend health: http://localhost:3001/health
- MinIO API: http://localhost:9000
- MinIO console: http://localhost:9001 (`minioadmin` / `minioadmin`)
- PostgreSQL: `localhost:5432` (`user` / `password`, database `aibook`)
- Redis: `localhost:6379`

### 3. Production-like (standalone build)

```bash
docker compose up -d --build
```

This builds the backend and frontend images, starts PostgreSQL, Redis, MinIO, and
runs both applications. It still uses `apps/backend/.env`. The production compose
does not run Prisma migrations automatically; apply the schema before starting it.

## Local Development

The recommended development loop keeps the backend in Docker and runs the
frontend on the host:

```bash
docker compose -f docker-compose.dev.yml up -d
npm run dev --workspace=apps/frontend
```

Individual workspace commands:

```bash
# Frontend only
npm run dev --workspace=apps/frontend

# Package manager scripts
npm run db:generate
npm run db:migrate:dev
npm run db:push
```

## Available Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start workspace dev tasks (currently the frontend only) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type-check all workspaces |
| `npm run test` | Run all unit tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate:dev` | Run Prisma migrations (dev) |
| `npm run db:push` | Push schema without migration |
| `npm run format` | Format with oxfmt |
| `npm run format:check` | Check formatting with oxfmt |

## Project Structure Details

### apps/backend

- NestJS modular architecture with a global `ValidationPipe`
- Modules: `book`, `book-generation`, `settings`, `child-profile`,
  `story-library`, `payment`, `pdf`, `storage`, `queue`, `ai`
- Prisma client from `@repo/database`
- BullMQ worker for background story generation
- `GET /health` liveness endpoint used by Docker smoke tests

Book lifecycle:

1. `POST /books/generate` validates ownership and enqueues a job.
2. The worker marks the book `GENERATING`, requests story text, replaces pages in
   one transaction, and moves the book to `REVIEW` (or `FAILED`).
3. Review can edit pages or regenerate with combined feedback.
4. Approval moves `REVIEW` to `COMPLETED`.
5. `POST /books/:id/pdf` lazily builds a PDF for a completed book, uploads it to
   MinIO, stores the public URL in `Book.pdfUrl`, and returns it.

### apps/frontend

- Next.js App Router with `(auth)` and `(app)` route groups
- Key routes: `/` (dashboard), `/books/new`, `/books/[id]`,
  `/books/[id]/generating`, `/books/[id]/preview`, `/profiles`, `/settings`,
  `/notifications`
- API calls are proxied via the `/api/*` rewrite in `next.config.mjs`
- `/books/[id]` redirects by status; completed books show a **Download PDF** button

### packages/database

- Prisma schema: `prisma/schema.prisma`
- Enums: `BookStatus`, `BookType`, `BookStyle`, `ReasoningEffort`, `Tone`
- Exports `createPrismaClient()` and Prisma types via `@repo/database`
- Deleting a child profile sets `Book.childId` to `NULL`; existing books remain

## Generation Settings

`/settings` loads and saves generation defaults:

- text model from the backend `LLM_MODELS` allowlist (plus `LLM_MODEL_NAME`)
- reasoning effort (`LOW`, `MEDIUM`, `HIGH`)

New books snapshot both values; existing books keep the settings they were created
with. Account, billing, and notification panels remain presentation-only.

## Environment Variables

### apps/backend/.env

```env
# Required
DATABASE_URL=postgresql://user:password@db:5432/aibook?schema=public
LLM_API_URL=https://api.deepseek.com/chat/completions
LLM_API_KEY=your-key
LLM_MODEL_NAME=deepseek-flash
LLM_MODELS=deepseek-flash,deepseek-v4-pro
LLM_DEFAULT_PROMPT="You are writing an original children's book adaptation..."

# Optional (defaults shown)
PORT=3001
REDIS_HOST=redis
REDIS_PORT=6379
MOCK_AUTH=true
S3_ENDPOINT=http://minio:9000
S3_PUBLIC_URL=http://localhost:9000
S3_BUCKET=aibook
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

`S3_ENDPOINT` is used by the backend container. `S3_PUBLIC_URL` is the
browser-facing base URL stored in `Book.pdfUrl`.

`LLM_MODELS` is an optional comma-separated allowlist for the Settings UI. The
active `LLM_MODEL_NAME` is always included; a user-selected model is snapshotted on
each new book and sent to the provider.

For Prisma commands run on the host (outside Docker), either export
`DATABASE_URL=postgresql://user:password@localhost:5432/aibook?schema=public` or
create `packages/database/.env` from `packages/database/.env.example`.

### apps/frontend/.env.example

```env
BACKEND_URL=http://localhost:3001
```

## Database

```bash
# Generate client after schema changes
npm run db:generate

# Create and run a migration
npm run db:migrate:dev

# Push schema directly (dev only)
npm run db:push

# Seed the story library
npm run seed --workspace=packages/database
```

## Testing

```bash
# Backend (Jest)
npm run test --workspace=apps/backend

# Frontend (Vitest)
npm run test --workspace=apps/frontend

# Type checking
npm run typecheck

# Lint and formatting
npm run lint
npm run format:check

# Frontend E2E (Playwright; stubs backend API)
npm run test:e2e --workspace=apps/frontend

# Opt-in live lifecycle test (requires backend, PostgreSQL, Redis, MinIO, and a stubbed LLM)
E2E_REAL_BACKEND=1 PLAYWRIGHT_PORT=3002 npm run test:e2e --workspace=apps/frontend -- e2e/book-lifecycle.live.spec.ts
```

## Docker Details

### docker-compose.yml (Production-like)

- Multi-stage Dockerfiles (`Dockerfile.backend`, `Dockerfile.frontend`)
- Builds standalone Next.js output
- Runs as the non-root `node` user
- Includes PostgreSQL, Redis, MinIO, and a one-shot bucket initializer
- The MinIO `aibook` bucket is public-read so the browser can open generated PDFs.
  Use a private bucket and signed URLs before production.
- Compose uses `elestio/minio` and `bitnamilegacy/minio-client` because the official
  `minio/minio` Docker Hub image is not always pullable. Pin digests for production.

### docker-compose.dev.yml (Development)

- Runs backend, PostgreSQL, Redis, MinIO, and MinIO bucket init in containers
- Frontend runs locally to keep file watching reliable on Docker Desktop
- Keeps `node_modules` out of the bind mount

### Docker Desktop (macOS)

Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).

## Current Limitations

- Authentication is a local mock session; all backend data belongs to one mock user.
- `/settings` exposes working generation defaults (text model + reasoning effort).
  Subscription, billing, account, and notification panels are presentation-only.
- Illustrations are not generated yet; pages are text-only.
- Payment webhook handling is a prototype without Stripe signature verification.
- PDFs are stored in MinIO with public-read access.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port conflicts | Ensure 3000, 3001, 5432, 6379, 9000, 9001 are free |
| Prisma client out of date | Run `npm run db:generate` |
| Backend exits on startup | Check `apps/backend/.env`; LLM variables are required |
| PDF download fails | Verify MinIO is running and `S3_*` values match |
| Frontend can't reach backend | Verify `BACKEND_URL` in frontend env |
| Docker build fails | Check `.dockerignore` excludes `node_modules` |

## License

Private project — internal use only.
