# Children's Book SaaS — Agent Guide (Index)

## Quick Navigation

| File | Contents |
|------|----------|
| [AGENTS-architecture.md](./agents/AGENTS-architecture.md) | Monorepo structure, Turbo, ports, workspace commands |
| [AGENTS-database.md](./agents/AGENTS-database.md) | Prisma schema, enums, data rules, client usage |
| [AGENTS-frontend.md](./agents/AGENTS-frontend.md) | Routes, routing rules, styling (Tailwind), testing |
| [AGENTS-backend.md](./agents/AGENTS-backend.md) | Backend modules, HTTP API surface, product state |
| [AGENTS-auth.md](./agents/AGENTS-auth.md) | Auth state, mock guards, key quirks |
| [AGENTS-docker.md](./agents/AGENTS-docker.md) | Docker Compose files, multi-stage builds, Colima |
| [AGENTS-docs-git.md](./agents/AGENTS-docs-git.md) | Docs location, Git conventions, commit format |
| [AGENTS-quickref.md](./agents/AGENTS-quickref.md) | All command tables (high-frequency reference) |
| [AGENTS-backlog.md](./agents/AGENTS-backlog.md) | Backlog reference (future work) |

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
| Monorepo structure, Turbo config, ports, workspace commands | `agents/AGENTS-architecture.md` |
| Prisma schema, enums, data rules, client usage | `agents/AGENTS-database.md` |
| Frontend routes, routing rules, styling, testing | `agents/AGENTS-frontend.md` |
| Backend modules, HTTP API surface, product state | `agents/AGENTS-backend.md` |
| Auth state, mock guards, key quirks | `agents/AGENTS-auth.md` |
| Docker Compose, Dockerfiles, Colima config | `agents/AGENTS-docker.md` |
| Docs location, Git conventions, commit format | `agents/AGENTS-docs-git.md` |
| Command tables | `agents/AGENTS-quickref.md` |
| Backlog items (add/remove/update) | `agents/AGENTS-backlog.md` + `backlog.md` |

**Rule:** No PR is complete without updating the relevant AGENTS file. Treat these as living documentation that must stay in sync with code.