# Create Child Profile Redirection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to initiate child profile creation directly from the "Create Book" page by redirecting to `/profiles?new=true`.

**Architecture:** Update `ProfileSelector` to use Next.js `useRouter` for redirection and update `ProfilesPage` to use `useSearchParams` to trigger the creation modal.

**Tech Stack:** Next.js (App Router), React, Lucide React, Vitest, Testing Library.

---

### Task 1: Update ProfileSelector with Redirection

**Files:**
- Modify: `apps/frontend/src/components/books/create-book/ProfileSelector.tsx`
- Create: `apps/frontend/src/components/books/create-book/ProfileSelector.spec.tsx`

- [ ] **Step 1: Write the failing test for ProfileSelector**

Create `apps/frontend/src/components/books/create-book/ProfileSelector.spec.tsx`.

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProfileSelector } from "./ProfileSelector";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("ProfileSelector redirection", () => {
  it("redirects to /profiles?new=true when 'Create Child Profile' button is clicked", () => {
    render(<ProfileSelector profiles={[]} selectedId="" onSelect={() => {}} />);
    
    // In header
    const headerBtn = screen.getByRole("button", { name: /Create Child Profile/i });
    fireEvent.click(headerBtn);
    expect(push).toHaveBeenCalledWith("/profiles?new=true");
  });

  it("shows 'Create Child Profile' button in empty state and redirects", () => {
    render(<ProfileSelector profiles={[]} selectedId="" onSelect={() => {}} />);
    
    // In empty state (to be added)
    const emptyStateBtn = screen.getByRole("button", { name: /Create First Profile/i });
    fireEvent.click(emptyStateBtn);
    expect(push).toHaveBeenCalledWith("/profiles?new=true");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest apps/frontend/src/components/books/create-book/ProfileSelector.spec.tsx`
Expected: FAIL (missing "Create First Profile" button and `useRouter` logic)

- [ ] **Step 3: Implement redirection logic and empty state CTA in ProfileSelector**

Modify `apps/frontend/src/components/books/create-book/ProfileSelector.tsx`.

```tsx
import { useRouter } from "next/navigation";
// ...
export function ProfileSelector({ profiles, selectedId, onSelect }: ProfileSelectorProps) {
  const router = useRouter();
  // ...
  <button
    type="button"
    onClick={() => router.push("/profiles?new=true")}
    className="..."
  >
    Create Child Profile
  </button>
  // ...
  {profiles.length === 0 ? (
    <div className="...">
      <div className="...">
        <User className="..." />
        <div className="...">
          <p className="...">No child profiles yet</p>
          <p className="...">Create a child profile to get started with personalized stories.</p>
          <button
            type="button"
            onClick={() => router.push("/profiles?new=true")}
            className="mt-2 text-[13px] font-extrabold text-primary underline-offset-4 hover:underline"
          >
            Create First Profile
          </button>
        </div>
      </div>
    </div>
  ) : (
    // ...
  )}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest apps/frontend/src/components/books/create-book/ProfileSelector.spec.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/books/create-book/ProfileSelector.tsx apps/frontend/src/components/books/create-book/ProfileSelector.spec.tsx
git commit -m "feat(create-book): add redirection to child profile creation"
```

---

### Task 2: Update ProfilesPage to Trigger Modal

**Files:**
- Modify: `apps/frontend/src/app/(app)/profiles/page.tsx`
- Modify: `apps/frontend/src/app/(app)/profiles/page.spec.tsx`

- [ ] **Step 1: Write the failing test for ProfilesPage**

Modify `apps/frontend/src/app/(app)/profiles/page.spec.tsx` to add a new test case.

```tsx
// Add at the top:
let searchParamNew: string | null = null;
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "new" ? searchParamNew : null),
  }),
}));

// Add to a describe block:
it("automatically opens the creation panel when ?new=true is present", async () => {
  searchParamNew = "true";
  render(<ProfilesPage />);

  await waitFor(() => {
    expect(screen.getByText("Edit profile")).toBeInTheDocument();
  });
  // Verify it's in create mode (no delete section)
  expect(screen.queryByText(/Delete.*profile\?/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest apps/frontend/src/app/(app)/profiles/page.spec.tsx`
Expected: FAIL (panel not opening automatically)

- [ ] **Step 3: Implement modal trigger logic in ProfilesPage**

Modify `apps/frontend/src/app/(app)/profiles/page.tsx`.

```tsx
import { useSearchParams } from "next/navigation";
// ...
export default function ProfilesPage() {
  const searchParams = useSearchParams();
  // ...
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      openCreatePanel();
    }
  }, [searchParams]);
  // ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest apps/frontend/src/app/(app)/profiles/page.spec.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/(app)/profiles/page.tsx apps/frontend/src/app/(app)/profiles/page.spec.tsx
git commit -m "feat(profiles): trigger profile creation modal via query param"
```
