# Auth & Key Quirks

## Auth State

Auth is transitional and split between backend and frontend concerns:

- Backend development mode relies on `MockAuthGuard`, which injects a mock user for protected controllers.
- Frontend still has a local mock auth/session layer in `AuthProvider`, `AuthGuard`, and `src/lib/mock-auth.ts`.
- `(auth)` and `(app)` route groups are currently enforced by that frontend mock session state.

Do not document auth as finished or real-session-backed. The intended direction is tracked in `backlog.md`: remove frontend mock auth and make the backend the source of truth.

## Key Quirks

- `StorageService` falls back to `minioadmin` credentials when related env vars are unset. Treat that as local-dev-only behavior.
- `MockAuthGuard` currently protects books, child profiles, story library, and settings endpoints.
- `SubscriptionGuard` currently checks a `user-email` request header for prototype subscription gating.
- `PrismaService` must disconnect explicitly on shutdown via `onModuleDestroy`.