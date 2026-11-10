# Backend

## Current Modules

- `book` — list, create, preview, edit, regenerate, approve, PDF creation/lookup
- `book-generation` — BullMQ worker for story generation and page parsing
- `settings` — generation defaults for new books (API only; UI is not wired)
- `child-profile` — child profile CRUD, scoped by user
- `story-library` — story catalog search
- `payment` — prototype webhook and subscription guard
- `pdf` — PDFKit rendering
- `storage` — S3/MinIO upload and public URL building
- `queue` — shared BullMQ registration
- `ai` — provider abstraction and OpenAI-compatible gateway
- `health` — `GET /health` liveness endpoint

## Nest DI Quirk

- Keep constructor-injected Nest dependencies as runtime imports, not `import type`.
- Type-only imports on injectable controllers/services erase the runtime metadata
  Nest uses for DI and can surface as `Function` resolution errors during bootstrap.
- DTO classes in controllers must also be runtime imports; `ValidationPipe` needs
  their decorator metadata.

## Validation

- `main.ts` enables `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`.
- `CreateBookDto`, `SearchQueryDto`, `PageEditDto`, and `RegenerateDto` live in
  `book.service.ts` and carry `class-validator` decorators.
- Child-profile DTOs live in `child-profile.controller.ts`.
- `UpdateGenerationSettingsDto` lives in `settings.controller.ts`.
- Unknown request fields return `400`; invalid enum values return `400`.

## HTTP API Surface (BookController)

- `GET /books?page=&limit=&sort=updated|title&title=&search=&style=&status=&childId=&type=&childName=`
- `POST /books/generate`
- `GET /books/:id`
- `GET /books/:id/preview`
- `PATCH /books/:id/pages/:pageNumber`
- `PATCH /books/:id/regenerate`
- `POST /books/:id/approve`
- `GET /books/:id/pdf` — returns an already-created PDF URL
- `POST /books/:id/pdf` — creates the PDF if needed and returns the URL

Status codes:

- `404` only for missing/foreign resources
- Wrong status transitions return `409 Conflict` (preview of a non-review book,
  approval of a non-review book, regeneration of a completed book, PDF before completion)

`GET /books` also returns `statusCounts` for the current user and active filters so
the dashboard summary is not limited to the current page.

## Other HTTP Surfaces

- `GET/POST/PATCH/DELETE /child-profiles`
- `GET /stories?search=&limit=&offset=`
- `GET/PATCH /settings/generation`
- `POST /payments/webhook`
- `GET /health`

## Ownership & Scoping Rules

- All `BookService` read/write methods take a mandatory `userId` and scope queries
  with `findFirst({ where: { id, userId } })`.
- `createAndGenerate` verifies that `childId` belongs to the caller.
- `ChildProfileService.findOne/update/remove` are user-scoped; foreign access → `404`.
- `approveBook` uses an atomic `updateMany({ where: { id, userId, status: REVIEW } })`.
- `regenerate` atomically transitions `REVIEW`/`FAILED` to `GENERATING`; pages are
  replaced by the worker, not deleted by the service.
- The stale-`GENERATING` sweep in `findAll` is scoped to the request user.
- `SubscriptionGuard` trusts only `request.user.email`; the old `user-email` header
  fallback has been removed.

## Generation Queue Contract

- The service enqueues `generate-book` with `{ bookId, parentFeedback? }`.
- `createAndGenerate` and `regenerate` set `GENERATING` before enqueueing.
- `BookProcessor` only handles `GENERATING` books; missing or terminal books throw
  BullMQ `UnrecoverableError`.
- Page deletion, page insertion, and the `REVIEW` transition happen in one
  `$transaction`.
- Story parsing accepts `Page N:`, `**Page N:**`, `Page N.`, inline pages, and a
  leading preamble. If no markers exist, blank-line paragraphs are used. Fewer
  than two pages mark the book `FAILED`.
- AI transport failures are retryable by the user through `PATCH /books/:id/regenerate`.

## PDF Flow

- `POST /books/:id/pdf` is available for `COMPLETED` books.
- On first call it renders all pages with PDFKit, uploads
  `books/<bookId>/book.pdf` to MinIO, saves `Book.pdfUrl`, and returns the URL.
- Subsequent calls return the stored URL.
- `S3_PUBLIC_URL` is the browser-facing base URL; `S3_ENDPOINT` is the
  container-to-MinIO endpoint.

## Generation Settings

- `GET/PATCH /settings/generation` returns the active `LLM_MODEL_NAME` and the
  user's persisted `reasoningEffort`.
- Model selection is **not active**: `preferredLlmModel` is stored in the schema but
  generation always uses `LLM_MODEL_NAME`. The Settings page is presentation-only.
- New books snapshot the active model and reasoning effort.

## Current Product State

- The end-to-end flow is: profile → story/style/tone → `GENERATING` → `REVIEW` →
  approve → `COMPLETED` → on-demand PDF.
- The create form sends `type=AI_ADAPTED`. `MANUAL` is accepted by the API schema but
  is not exposed in the UI and still goes through AI generation.
- Illustrations are not generated.
- Payment webhook handling is a prototype and does not verify Stripe signatures.
- `MOCK_AUTH=true` injects one mock user and keeps `subscriptionActive=true`.
