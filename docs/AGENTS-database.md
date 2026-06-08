# Database

## Prisma Location

Prisma lives in `packages/database/prisma/schema.prisma`.

## Key Implementation Details

- Prisma 7 uses the `@prisma/adapter-pg` driver adapter, not the legacy query engine flow.
- The shared client is created via `createPrismaClient()` in `packages/database/index.ts`.
- Run `npm run generate` in `packages/database` after schema changes.
- Backend code imports Prisma types and enums from `@repo/database`.

## Current Schema Enums

Use Prisma enums instead of raw strings whenever types are available:

- `BookStatus`
- `BookType`
- `BookStyle`
- `ReasoningEffort`
- `Tone`

## Important Data Rules

Already encoded in schema:

- `Page` has `@@unique([bookId, pageNumber])`
- All core relations use `onDelete: Cascade`
- `User` stores default generation preferences via `preferredLlmModel` and `preferredReasoningEffort`