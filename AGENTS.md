# Children's Book SaaS — Agent Guide (Index)

## Quick Navigation

| File | Contents |
|------|----------|
| [AGENTS-architecture.md](./AGENTS-architecture.md) | Monorepo structure, Turbo, ports, workspace commands |
| [AGENTS-database.md](./AGENTS-database.md) | Prisma schema, enums, data rules, client usage |
| [AGENTS-frontend.md](./AGENTS-frontend.md) | Routes, routing rules, styling (Tailwind), testing |
| [AGENTS-backend.md](./AGENTS-backend.md) | Backend modules, HTTP API surface, product state |
| [AGENTS-auth.md](./AGENTS-auth.md) | Auth state, mock guards, key quirks |
| [AGENTS-docker.md](./AGENTS-docker.md) | Docker Compose files, multi-stage builds, Colima |
| [AGENTS-docs-git.md](./AGENTS-docs-git.md) | Docs location, Git conventions, commit format |
| [AGENTS-quickref.md](./AGENTS-quickref.md) | All command tables (high-frequency reference) |

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

## Current Product State

The app is still a prototype, but the current flow is more advanced than the original scaffold:

- New books are created with user-level generation defaults and queued for background generation.
- The frontend has explicit generating, review, failed, and completed states in the book flow.
- Review/approval is part of the main flow before a book becomes `COMPLETED`.
- PDF access is a separate backend lookup once a completed book has a stored `pdfUrl`.