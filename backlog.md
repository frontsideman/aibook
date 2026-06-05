# Backlog

## Breadcrumbs

1. Show real book title in breadcrumb instead of "Book".
   - Fetch book title from backend for `/books/[id]` routes.
   - Pass title to `PageBreadcrumb` or use a React context/SWR hook.
   - Update breadcrumb label dynamically once the title loads.
   - Keep "Book" as loading/fallback state.

## Auth Follow-up

Current interim mock solution:
- Development mode uses a backend-owned mock user via `MockAuthGuard`.
- The frontend should not keep its own mock session or `localStorage` auth state.
- Books, child profiles, settings, and story library data should come from the database through backend APIs.
- The backend is responsible for ensuring the mock user exists when development mode is enabled.

1. Add an explicit logout entry point in the app shell.
   - Decide whether logout remains meaningful while backend mock auth auto-injects the development user.
   - If retained, define whether it redirects to `/login`, disables app access, or only explains development-mode behavior.
   - Cover the final logout behavior with frontend tests and a browser smoke-check.

2. Replace frontend mock auth with backend-backed auth.
   - Replace the backend-owned development mock user with real backend session handling.
   - Re-evaluate whether the existing `(auth)` and `(app)` guard boundaries still fit the final auth contract.
   - Update login/signup flows, route protection, and tests to match the real auth contract.

## Book Creation Flow Follow-up

1. Design a polished visual experience for the `Generating Book` page.
   - Define the final layout, hierarchy, and copy for the loading state.
   - Design `REVIEW` handoff cues and the `FAILED` recovery state.
   - Keep the page compatible with the functional polling flow already defined in the book creation spec.
