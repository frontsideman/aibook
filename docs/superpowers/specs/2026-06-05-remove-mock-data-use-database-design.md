# Remove Mock Data And Use Database Design

## Summary

Replace frontend runtime mock data with real backend and database-backed responses while keeping a development-only backend mock user.

The backend remains the single owner of the development user identity through `MockAuthGuard`. The frontend stops storing a local mock session and behaves like a normal API client for books, child profiles, settings, and story library data.

## Scope

In scope:
- remove runtime MSW-backed fake API data from the frontend
- remove frontend-owned mock auth session state
- load books, child profiles, settings, and story library data from backend APIs backed by Prisma
- keep backend `MockAuthGuard` as the temporary development identity mechanism
- ensure the backend mock user exists automatically in development mode
- preserve existing loading, empty, and error states across frontend pages
- update tests to reflect backend-shaped responses instead of local mock storage or runtime MSW

Out of scope:
- real authentication and session management
- production auth design
- automatic seeding of fake sample books, profiles, or stories

## Approach Options

### Recommended: API Cutover With Backend-Owned Dev User

- Keep `MockAuthGuard` in the backend.
- Remove frontend mock session storage and runtime MSW bootstrapping.
- Fetch all real app data from backend routes.
- Ensure the backend mock user exists on demand.

Why this is recommended:
- one source of truth for current user identity
- removes fake content without expanding into full auth work
- preserves local development ergonomics
- leaves a clean migration path to real auth later

### Rejected: Hybrid Frontend Auth Plus Real Data

Keep frontend mock auth while moving only books and profiles to the backend.

Reason rejected:
- creates split ownership of identity
- makes debugging user-scoped data ambiguous
- increases cleanup cost for the later auth migration

### Rejected: Automatic Sample Content Seeding

Auto-create sample books, profiles, or stories for the development user.

Reason rejected:
- reintroduces fake content after the cutover
- makes empty states harder to verify
- obscures whether the app is using real stored data

## Backend Design

### Mock User Ownership

The backend remains responsible for development identity.

- `MockAuthGuard` continues to inject a stable mock user into requests
- backend code ensures a matching Prisma `User` row exists before user-scoped queries and mutations rely on `req.user.id`
- the ensure-user behavior must be idempotent and safe to call repeatedly

### Data Ownership

- books remain scoped by backend user id
- child profiles remain scoped by backend user id
- generation settings remain scoped by backend user id
- story library remains shared database content queried directly from Prisma

### Empty Database Behavior

On first run with an empty database:

- the backend auto-creates or ensures the mock user record
- books return an empty paginated response
- child profiles return an empty array
- story library returns an empty array when no rows exist or no rows match search
- generation settings resolve from persisted values or existing defaults

No sample books, profiles, or stories are created automatically.

## Frontend Design

### Runtime Data Flow

The frontend becomes a plain API client.

- dashboard reads real `/api/books` results
- profiles page reads and mutates real `/api/child-profiles` results
- create-book flow uses real child profiles and story library results
- settings page reads and writes real `/api/settings/generation` values
- book detail, preview, generating, and approval flows use backend book state only

### Auth UI Simplification

The frontend no longer owns session state.

- remove runtime dependency on `localStorage` mock auth state
- remove frontend logic that creates demo sessions
- remove `(app)` route protection that depends on frontend session checks
- repurpose or reduce `/login`, `/signup`, and `/logout` behavior so they no longer imply real frontend-authenticated state

This is an interim development posture only. Real auth remains a separate follow-up.

### Empty State Meaning

Frontend empty states must now represent real database emptiness, not missing fixtures.

- dashboard empty state means no books exist for the backend mock user
- profiles empty state means no child profiles exist for the backend mock user
- story search empty state means no database rows match the query

## Error Handling

### Backend

Return normal empty responses for valid requests with no data:

- `/books` returns an empty pagination payload
- `/child-profiles` returns `[]`
- `/stories` returns `[]` when no rows match

Return real errors for invalid operations:

- `404` for unknown or inaccessible record ids
- validation errors for invalid payloads
- `500` for genuine server or infrastructure failures

Mock-user bootstrap failure is a backend error, not a frontend auth state.

### Frontend

Frontend screens should distinguish between:

- loading state
- empty data state
- retryable fetch failure
- record-not-found behavior on detail routes

Pages must not infer auth failure from missing frontend session state because the frontend no longer owns one.

## Testing

### Backend Tests

- add coverage for mock-user bootstrap or ensure-user behavior
- verify books, profiles, and settings resolve correctly for the ensured mock user
- verify empty-state payloads when no user-owned records exist

### Frontend Tests

- remove tests centered on `MOCK_AUTH_STORAGE_KEY`, local session persistence, and runtime MSW startup
- stub `fetch` at the page or component boundary
- verify loading, empty, success, and error states using backend-shaped payloads
- keep pure view-model tests where useful, but align them with backend response shapes

### Browser Smoke Coverage

Keep one smoke path that verifies:

- app opens under backend mock-user mode
- real backend requests succeed
- a user can create or fetch database-backed records without seeded fake content

## Impacted Areas

Likely code areas affected by this design:

- `apps/frontend/src/components/auth/*`
- `apps/frontend/src/lib/mock-auth.ts`
- `apps/frontend/src/components/MSWProvider.tsx`
- `apps/frontend/src/mocks/*`
- `apps/frontend/src/app/layout.tsx`
- `apps/frontend/src/app/(auth)/*`
- `apps/frontend/src/app/logout/*`
- `apps/frontend/src/app/(app)/*`
- `apps/backend/src/mock-auth.guard.ts`
- backend controllers or services that rely on the injected mock user
- Prisma seed or setup flows only if needed for shared story-library content

## Acceptance Criteria

1. The frontend does not use runtime MSW data for books, profiles, settings, or story search.
2. The frontend does not store or restore a local mock auth session.
3. Backend development mode provides one stable mock user and ensures the user row exists automatically.
4. Books, child profiles, settings, and story library data come from backend APIs backed by the database.
5. Empty states reflect real missing data in the database rather than missing fixtures.
6. Tests cover the new backend-owned mock-user behavior and real API-shaped frontend flows.
