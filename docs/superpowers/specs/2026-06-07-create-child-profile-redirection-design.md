# Design Specification: Create Child Profile Redirection

**Date:** 2026-06-07
**Status:** Approved

## Goal
Enable users to initiate child profile creation directly from the "Create Book" page. Clicking the "Create Child Profile" button should redirect them to the Profiles page and automatically open the "Add Profile" modal.

## User Flow
1. User is on `/books/new`.
2. User clicks "Create Child Profile" in the profile selection step.
3. User is redirected to `/profiles?new=true`.
4. The Profiles page loads, and the "Add Profile" panel opens automatically.

## Technical Changes

### 1. `apps/frontend/src/components/books/create-book/ProfileSelector.tsx`
- **Update:** Add navigation logic to the "Create Child Profile" button.
- **Addition:** Add a CTA button to the empty state (`profiles.length === 0`) that also redirects to `/profiles?new=true`.
- **Implementation:**
  - Use `useRouter` from `next/navigation`.
  - Add `const router = useRouter()`.
  - Update buttons to use `onClick={() => router.push('/profiles?new=true')}`.

### 2. `apps/frontend/src/app/(app)/profiles/page.tsx`
- **Update:** Detect the `new=true` query parameter and trigger the creation panel.
- **Implementation:**
  - Use `useSearchParams` from `next/navigation`.
  - Add a `useEffect` that monitors `searchParams`.
  - If `searchParams.get('new') === 'true'`, call `openCreatePanel()`.

## Verification Plan

### Automated Tests
- **`ProfilesPage.spec.tsx`**: Add a test case to verify that the creation panel opens when the `new` query parameter is present.
- **`ProfileSelector.spec.tsx`**: (Create if not exists or update) Verify that clicking the "Create Child Profile" button calls `router.push` with the correct path.

### Manual Verification
1. Navigate to `/books/new`.
2. Click "Create Child Profile".
3. Verify redirection to `/profiles?new=true` and that the modal is open.
4. Try again with no profiles existing (if possible in mock environment).
