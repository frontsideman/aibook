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

## Generation Settings HTTP Surface

- `GET /settings/generation`
- `PATCH /settings/generation`

## Current Product State

The app is still a prototype, but the current flow is more advanced than the original scaffold:

- New books are created with user-level generation defaults and queued for background generation.
- The frontend has explicit generating, review, failed, and completed states in the book flow.
- Review/approval is part of the main flow before a book becomes `COMPLETED`.
- PDF access is a separate backend lookup once a completed book has a stored `pdfUrl`.
