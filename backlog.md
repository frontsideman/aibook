# Backlog

## Auth Follow-up

1. Add an explicit logout entry point in the app shell.
   - Provide a visible control for clearing the frontend mock session.
   - Redirect the user back to `/login` after logout.
   - Cover the logout path with frontend tests and a browser smoke-check.

2. Replace frontend mock auth with backend-backed auth.
   - Keep the existing `(auth)` and `(app)` guard boundaries.
   - Swap `localStorage` mock session flow for real backend session handling.
   - Update login/signup flows, route protection, and tests to match the real auth contract.
