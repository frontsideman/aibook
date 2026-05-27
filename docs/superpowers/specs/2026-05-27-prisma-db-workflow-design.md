# Prisma / DB Workflow Design (Migration-ready, Criterion 1)

Date: 2026-05-27
Status: Approved for spec write
Scope: Sub-project 2 from stability roadmap

## 1. Goal and Success Criteria

Standardize a single Prisma workflow for schema evolution and client generation in the monorepo.

Success criteria:
1. Canonical workflow is documented and unambiguous.
2. Scripts exist for `generate`, `migrate dev`, and explicit `db push` fallback.
3. Root-level proxy scripts exist for consistent developer DX.

## 2. Scope

In scope:
- `packages/database/package.json` scripts normalization
- Root `package.json` proxy scripts for DB workflow
- Written spec and operational guidance

Out of scope:
- CI gating for Prisma operations
- Enum enforcement in backend code paths
- Migration policy hardening beyond local development workflow

## 3. Canonical Workflow

1. Developer updates `packages/database/prisma/schema.prisma`.
2. Run `npm run generate` in `packages/database`.
3. Primary local schema evolution path: `npm run migrate:dev`.
4. Temporary prototype fallback: `npm run db:push`.
5. Build/typecheck dependent apps only after Prisma client is regenerated.

## 4. Script Contract

### 4.1 `packages/database`

Required scripts:
- `generate`: `prisma generate`
- `migrate:dev`: `prisma migrate dev`
- `db:push`: `prisma db push`

### 4.2 Root workspace

Required proxy scripts:
- `db:generate`: run workspace database `generate`
- `db:migrate:dev`: run workspace database `migrate:dev`
- `db:push`: run workspace database `db:push`

Contract intent:
- Root commands are the default entry point for team-wide consistency.
- Package-local commands remain valid for focused DB work.

## 5. Process Rules

- `migrate:dev` is the default for local iterative schema changes and migration history continuity.
- `db:push` is allowed only as a documented prototype fallback when migration history is not required for the current task.
- `generate` must be run after schema changes before consuming `@repo/database` in backend/frontend builds.

## 6. Error Flow

- Missing `generate` after schema change may surface as type/build/runtime drift in dependent packages.
- Workflow violation is treated as process error (not code-level guardrail in this phase).
- This cycle intentionally relies on script and documentation clarity rather than CI enforcement.

## 7. Validation Strategy

Operational checks in implementation phase:
1. Run root `db:generate` successfully.
2. Run root `db:migrate:dev` against local dev DB.
3. Run root `db:push` as fallback path verification.

Note:
- CI checks are deferred to sub-project `CI quality gate`.

## 8. Risks and Mitigations

Risk: Team continues using inconsistent local commands.
- Mitigation: root proxy scripts become canonical; spec documents precedence.

Risk: `db:push` overused and migration history diverges.
- Mitigation: explicitly label `db:push` as temporary fallback in docs and examples.

## 9. Acceptance Checklist

- [ ] Spec documents a single canonical Prisma workflow.
- [ ] `packages/database` has `generate`, `migrate:dev`, `db:push` scripts.
- [ ] Root workspace has `db:generate`, `db:migrate:dev`, `db:push` scripts.
- [ ] Workflow explicitly marks `migrate:dev` as default and `db:push` as fallback.
