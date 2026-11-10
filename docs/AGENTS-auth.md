# Auth & Key Quirks

## Auth State

Auth is transitional and split between backend and frontend concerns:

- Backend development mode relies on `MockAuthGuard`, which injects a mock user for
  protected controllers and upserts that user with `subscriptionActive=true`.
- Frontend still has a local mock auth/session layer in `AuthProvider`, `AuthGuard`,
  and `src/lib/mock-auth.ts`.
- `(auth)` and `(app)` route groups are enforced by that frontend mock session state.
- The frontend session is not sent to the backend; the backend always uses its
  `mock-user-id` user.

Do not document auth as finished or real-session-backed. The intended direction is
tracked in `AGENTS-backlog.md`: remove frontend mock auth and make the backend the
source of truth.

## Key Quirks

- `StorageService` falls back to `minioadmin` credentials when related env vars are
  unset. Treat that as local-dev-only behavior.
- `MockAuthGuard` protects books, child profiles, story library, settings, and PDF routes.
- `SubscriptionGuard` uses only `request.user.email`; the legacy `user-email`
  header fallback was removed.
- Because `MockAuthGuard` upserts `subscriptionActive=true` on every request,
  subscription gating is effectively always open in mock mode.
- `PrismaService` disconnects explicitly on shutdown via `onModuleDestroy`; the app
  enables Nest shutdown hooks.
- Password reset and Google sign-in are not implemented. `/forgot-password` explains
  the mock-auth limitation; the Google button is a visual placeholder.
