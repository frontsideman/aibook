# Children's Book SaaS — Agent Guide (Index)

## Quick Navigation

| File | Contents |
|------|----------|
| [AGENTS-architecture.md](./docs/AGENTS-architecture.md) | Monorepo structure, Turbo, ports, workspace commands |
| [AGENTS-database.md](./docs/AGENTS-database.md) | Prisma schema, enums, data rules, client usage |
| [AGENTS-frontend.md](./docs/AGENTS-frontend.md) | Routes, routing rules, styling (Tailwind), testing |
| [AGENTS-backend.md](./docs/AGENTS-backend.md) | Backend modules, HTTP API surface, product state |
| [AGENTS-auth.md](./docs/AGENTS-auth.md) | Auth state, mock guards, key quirks |
| [AGENTS-docker.md](./docs/AGENTS-docker.md) | Docker Compose files, multi-stage builds, Colima |
| [AGENTS-docs-git.md](./docs/AGENTS-docs-git.md) | Docs location, Git conventions, commit format |
| [AGENTS-quickref.md](./docs/AGENTS-quickref.md) | All command tables (high-frequency reference) |
| [AGENTS-backlog.md](./docs/AGENTS-backlog.md) | Backlog reference (future work) |

## When to Load What

| Task Type | Load These Files |
|-----------|------------------|
| Backend API work | AGENTS.md + architecture + database + backend |
| Frontend UI work | AGENTS.md + architecture + frontend |
| Database schema | AGENTS.md + architecture + database |
| Auth/session | AGENTS.md + architecture + auth |
| Docker/CI | AGENTS.md + architecture + docker |
| Commits/Git | AGENTS.md + docs-git |
| Quick command lookup | AGENTS-quickref.md |
| Future work awareness | AGENTS-backlog.md |

## Current Product State

The app is still a prototype, but the current flow is more advanced than the original scaffold:

- New books are created with user-level generation defaults and queued for background generation.
- The frontend has explicit generating, review, failed, and completed states in the book flow.
- Review/approval is part of the main flow before a book becomes `COMPLETED`.
- PDF access is a separate backend lookup once a completed book has a stored `pdfUrl`.

## Update Rule for AGENTS Documentation

**MANDATORY:** When modifying any of the following areas, you MUST update the corresponding AGENTS file:

| Area Changed | Update File |
|--------------|-------------|
| Monorepo structure, Turbo config, ports, workspace commands | `docs/AGENTS-architecture.md` |
| Prisma schema, enums, data rules, client usage | `docs/AGENTS-database.md` |
| Frontend routes, routing rules, styling, testing | `docs/AGENTS-frontend.md` |
| Backend modules, HTTP API surface, product state | `docs/AGENTS-backend.md` |
| Auth state, mock guards, key quirks | `docs/AGENTS-auth.md` |
| Docker Compose, Dockerfiles, Colima config | `docs/AGENTS-docker.md` |
| Docs location, Git conventions, commit format | `docs/AGENTS-docs-git.md` |
| Command tables | `docs/AGENTS-quickref.md` |
| Backlog items (add/remove/update) | `docs/AGENTS-backlog.md` |

**Rule:** No PR is complete without updating the relevant AGENTS file. Treat these as living documentation that must stay in sync with code.

## Code Review & Git Workflow (Summary)

See [`docs/AGENTS-docs-git.md`](./docs/AGENTS-docs-git.md) for full rules.

- **Code Review Standards**: Verify Conventional Commits format before commit; suggest corrections; ask for confirmation
- **Git Workflow**: Review changes first → generate conventional message → never commit non-conventional unless explicitly requested