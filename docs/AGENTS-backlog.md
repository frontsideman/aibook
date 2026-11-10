# Backlog

## Breadcrumbs

1. Show the real book title in the breadcrumb instead of "Book".
   - Fetch the book title for `/books/[id]` routes.
   - Pass the title to `PageBreadcrumb` or use a React context/SWR hook.
   - Keep "Book" as the loading/fallback state.

## Auth Follow-up

Current interim state:

- Backend development mode uses `MockAuthGuard` with one mock user.
- Frontend still keeps a local mock session in `localStorage`.
- The frontend session is not sent to the backend.

1. Replace frontend mock auth with backend-backed auth.
   - Make the backend the source of truth for the user.
   - Update login/signup/logout and route protection.
   - Re-evaluate whether `(auth)`/`(app)` guard boundaries still fit.
2. Implement password reset and Google sign-in, or remove the placeholders.
   - `/forgot-password` currently only explains the mock limitation.
   - The Google button is visual only.

## Settings

1. Decide whether generation settings return to the UI.
   - Backend exposes `GET/PATCH /settings/generation`.
   - `/settings` is currently presentation-only and does not call the API.
2. Add a model registry before enabling model selection.
   - `preferredLlmModel` is stored but ignored; generation uses `LLM_MODEL_NAME`.
   - Validate models against the configured provider before persisting them.

## Illustrations

1. Add illustration generation if the product requires it.
   - The schema has `Illustration`, the preview has a placeholder, and the PDF
     renderer already accepts `imageUrl`.
   - Generation currently produces text pages only.

## PDF & Storage

1. Replace public-read MinIO objects with private objects and signed URLs.
2. Add PDF cleanup/retention rules for deleted books.
3. Consider generating the PDF during approval instead of on first download if
   download latency becomes a problem.

## Payments

1. Replace the prototype webhook with verified Stripe/Paddle signatures.
2. Map subscription lifecycle events to users reliably (customer id, not email).
3. Make `SubscriptionGuard` meaningful with real sessions and billing state.

## Story Library

The frontend create form now searches `/api/stories` and the backend catalog is
seeded. Optional follow-up:

1. Use `StoryLibrary.promptHint` in generation prompts instead of relying on the
   model's knowledge of the story title.

## Testing & Quality

1. Turn the Playwright stubbed-API smoke test into a real end-to-end flow with
   backend, database, and a stubbed LLM provider.
2. Add an integration test for child-profile deletion keeping books with
   `childId = NULL`.
3. Upgrade NestJS 10 → 12, Prisma, and CLI tooling to clear remaining `high`
   `npm audit` findings.
4. Add a migration check against a real PostgreSQL instance in CI.

## Update Rule

When adding/removing/updating backlog items:
1. Update this file to reflect changes.
