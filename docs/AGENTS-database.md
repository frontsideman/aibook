# Database

## Prisma Location

Prisma lives in `packages/database/prisma/schema.prisma`.

## Key Implementation Details

- Prisma 7 uses the `@prisma/adapter-pg` driver adapter, not the legacy query engine flow.
- The shared client is created via `createPrismaClient()` in `packages/database/index.ts`.
- Run `npm run generate` in `packages/database` after schema changes.
- Backend code imports Prisma types and enums from `@repo/database`.
- Host-run Prisma commands need `DATABASE_URL` in the environment or in
  `packages/database/.env`.
- Prisma packages are pinned to the same minor version across root and workspace
  (`7.10.x` at the time of writing).

## Current Schema Enums

Use Prisma enums instead of raw strings whenever types are available:

- `BookStatus`
- `BookType`
- `BookStyle`
- `ReasoningEffort`
- `Tone`

## Models

`User`, `ChildProfile`, `Book`, `Page`, `Illustration`, `StoryLibrary`.

## Important Data Rules

Already encoded in schema:

- `Page` has `@@unique([bookId, pageNumber])`.
- `User → Book` and `User → ChildProfile` cascade on user deletion.
- `Book → Page` and `Page → Illustration` cascade.
- `Book.childId` is optional and `onDelete: SetNull`: deleting a child profile keeps
  existing books. The migration is
  `20261110_book_child_set_null`.
- `User` stores generation preferences via `preferredLlmModel` and
  `preferredReasoningEffort`. Both are active; preferences outside the
  `LLM_MODELS` allowlist fall back to `LLM_MODEL_NAME`.
- `Book` snapshots `llmModel` and `reasoningEffort` at creation time; the gateway
  sends that snapshot to the provider.
- `Book.pdfUrl` is filled lazily on the first PDF download for a completed book.

## Migrations

- `20260605_require_book_generation_snapshot` — generation settings and book snapshots
- `20261110_book_child_set_null` — keep books when a child profile is deleted

These migrations are incremental patches for existing databases. A brand-new
development database is created with `npm run db:push`, not by replaying the full
migration history.

## Seed

`prisma/seed.ts` seeds the classic story library with `skipDuplicates: true`.
