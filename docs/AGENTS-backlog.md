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

Generation defaults (model + reasoning effort) are now live and applied to new
books. Remaining follow-up:

1. Add per-model metadata (provider, pricing, capabilities) once more than one
   provider is supported.
2. Keep the account, billing, notification, and danger-zone panels static until
   real billing and account APIs exist.

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

1. Add the opt-in live lifecycle test to CI with a stubbed LLM container and
   provisioned PostgreSQL/Redis/MinIO services.
2. Add an integration test for child-profile deletion keeping books with
   `childId = NULL`.
3. Upgrade NestJS 10 → 12, Prisma, and CLI tooling to clear remaining `high`
   `npm audit` findings.
4. Add a migration check against a real PostgreSQL instance in CI.

## Update Rule

When adding/removing/updating backlog items:
1. Update this file to reflect changes.
