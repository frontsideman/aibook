# Auth Pages Mock Session Design

Date: 2026-06-04
Status: Approved (brainstorming)
Scope: `apps/frontend`

## 1. Goal

Implement the `Login` and `Signup` frontend pages from the Pencil designs, add route protection for auth and app route groups, and introduce a local mock session for a test user so the frontend auth flow is navigable without backend authentication.

This design covers:
- Pencil-aligned `/login` and `/signup` UI
- Frontend-only mock session state
- Route guards for `(auth)` and `(app)` groups
- Demo user flow for local development and QA
- Test coverage for page behavior and guarded routing

Out of scope:
- Real backend authentication
- Token handling, cookies, or middleware auth
- Password reset implementation
- Google authentication implementation
- Backend API changes

## 2. Routing and Session Architecture

### 2.1 Route groups

Keep the existing App Router split:
- `(auth)` group: unauthenticated pages only
- `(app)` group: authenticated app pages only

Behavior:
- `/login` and `/signup` redirect to the app home route when a mock session exists
- all pages under `(app)` redirect to `/login` when no mock session exists

Guard decisions should live at the route-group layout level, not in individual pages.

### 2.2 Mock session source of truth

Introduce a frontend-only mock auth module backed by `localStorage`.

It stores one serialized demo user session and exposes:
- session read
- session create for login
- session create for signup
- session clear for logout

`localStorage` is the chosen persistence layer so the session survives refresh during manual QA.

### 2.3 Frontend auth state access

Add a thin client-side provider and hook over the mock auth module.

Responsibilities:
- hydrate the initial auth state from `localStorage`
- expose `user`, `isAuthenticated`, and `isHydrating`
- expose `loginDemo`, `signupDemo`, and `logout`

The forms and guarded layouts should depend on the provider API, not on `localStorage` directly.

## 3. Page Behavior

### 3.1 Login page

The login page should match the Pencil frame `aiBook Login Page` and include:
- brand mark and `aiBook` wordmark
- title and subtitle
- email field
- password field
- primary submit CTA
- secondary `Continue with Google` CTA
- `Forgot password?` link
- `Create account` link
- inline validation/error state
- loading CTA state

Submit behavior:
- local validation only
- on success, create the demo session and redirect into the app
- on failure, show the inline validation block

The Google CTA remains visible but non-functional in this scope.
The forgot-password link remains visible but does not start a real recovery flow in this scope.

### 3.2 Signup page

The signup page should match the Pencil frame `aiBook Signup Page` and include:
- brand mark and `aiBook` wordmark
- title and subtitle
- name field
- email field
- password field
- password helper copy
- primary submit CTA
- footer login link
- inline validation/error state
- loading CTA state

Submit behavior:
- local validation only
- on success, create the demo session and redirect into the app
- on failure, show the inline validation block

### 3.3 Validation and UI-only constraints

Validation stays intentionally minimal:
- email is required and must have valid format
- password is required on login
- name, email, and password are required on signup
- signup password must be at least 8 characters

Errors are rendered inline using the validation state block from the Pencil designs.
No toast system or backend error mapping is introduced in this pass.

### 3.4 Demo user behavior

The auth UI should make the demo flow obvious for local usage.

Use visible helper copy on the login page that identifies the demo user and explains that submitting the form starts a local mock session.

Do not prefill the form fields automatically in this pass.

## 4. Component and Code Boundaries

Use three clear layers:

### 4.1 Mock auth module

A dedicated frontend auth utility owns:
- demo user type
- storage key
- serialization and parsing
- create and clear helpers

This module is framework-light and should be testable without page rendering.

### 4.2 Guarded layouts

`(auth)` and `(app)` layouts own route access decisions.

They should:
- wait until client hydration resolves
- avoid rendering the wrong layout during session restoration
- redirect based on the mock session state

They should not contain form logic.

### 4.3 Auth form components

`LoginForm` and `SignupForm` should:
- render the Pencil-aligned structure
- manage local field state and validation state
- trigger provider actions on submit
- render loading and error variants

They should not own navigation rules beyond invoking the auth action flow.

## 5. Testing and Verification

Required tests:
- auth page tests for visible fields, CTA labels, demo user affordance, loading state, and inline validation rendering
- guarded layout tests for guest-to-login redirect and authenticated-user-to-app redirect
- mock auth module tests for empty state, persisted state restore, session creation, and logout

Verification gates before implementation is considered complete:
- frontend tests pass
- frontend build passes

## 6. Definition of Done

The feature is complete when:
1. `/login` and `/signup` visually align with the selected Pencil auth frames.
2. The frontend can create a local demo session with no backend dependency.
3. Auth pages reject authenticated users and app pages reject guests.
4. Successful login and signup both redirect into the app flow.
5. Inline loading and validation states exist on both pages.
6. Tests cover auth UI behavior, mock session behavior, and guarded routing.
