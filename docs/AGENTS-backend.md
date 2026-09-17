# Backend

## Current Modules

- `book` — list, create, preview, edit, regenerate, approve, PDF lookup
- `book-generation` — BullMQ worker/processor for generation jobs
- `settings` — generation defaults for new books
- `child-profile`
- `story-library`
- `payment`
- `pdf`
- `storage`
- `queue`
- `ai`

## Nest DI Quirk

- Keep constructor-injected Nest dependencies as runtime imports, not `import type`.
- Type-only imports on injectable controllers/services erase the runtime metadata Nest uses for DI and can surface as `Function` resolution errors during bootstrap.

## HTTP API Surface (BookController)

- `GET /books`
- `POST /books/generate`
- `GET /books/:id`
- `GET /books/:id/preview`
- `PATCH /books/:id/pages/:pageNumber`
- `PATCH /books/:id/regenerate`
- `POST /books/:id/approve`
- `GET /books/:id/pdf`

Status codes: `404` only for missing/foreign resources; wrong-status transitions
(preview of `DRAFT`/`GENERATING`, approve of non-`REVIEW`) return `409 Conflict`.

## Validation

- Global `ValidationPipe({ whitelist: true, transform: true })` in `main.ts`.
- `CreateBookDto`/`SearchQueryDto`/`PageEditDto`/`RegenerateDto` (`book.service.ts`)
  and child-profile DTOs carry `class-validator` decorators.
- Controllers must import DTO classes as runtime values, not `import type`,
  otherwise pipe metadata is lost (same reason as the Nest DI quirk below).

## Ownership & Scoping Rules

- All `BookService` read/write methods take mandatory `userId: string` and scope
  queries via `findFirst({ where: { id, userId } })` (`findUnique` cannot filter
  by non-unique `userId`; `update` needs a unique `where`).
- `createAndGenerate` rejects a `childId` not owned by the caller (`404`).
- `ChildProfileService.findOne/update/remove` are user-scoped; foreign access → `404`.
- `approveBook` uses atomic `updateMany({ where: { id, userId, status: REVIEW } })`
  to avoid scoped-read → unscoped-write TOCTOU.
- `findAll` scopes the stale-`GENERATING` → `FAILED` sweep by the request `userId`.
- `editPage` parent feedback is capped at 2000 chars (`400` when exceeded).

## Generation Queue Contract

- `queue.add('generate-book', ...)` always passes `{ jobId: 'generate-<bookId>' }`
  for dedupe.
- The service never deletes pages; `BookProcessor` runs
  `page.deleteMany({ bookId })` + inserts + `REVIEW` transition inside one `$transaction`.
- The processor only handles `GENERATING` books; missing/terminal-state books and
  unparsable LLM output throw BullMQ `UnrecoverableError` (no retry).
  AI transport failures stay retryable.

## Generation Settings HTTP Surface

- `GET /settings/generation`
- `PATCH /settings/generation`

## Current Product State

The app is still a prototype, but the current flow is more advanced than the original scaffold:

- New books are created with user-level generation defaults and queued for background generation.
- The frontend has explicit generating, review, failed, and completed states in the book flow.
- Review/approval is part of the main flow before a book becomes `COMPLETED`.
- PDF access is a separate backend lookup once a completed book has a stored `pdfUrl`.
