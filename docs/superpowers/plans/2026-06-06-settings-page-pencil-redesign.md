# Settings Page Pencil Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/settings` to match the selected Pencil composition as a static, presentation-only page with no generation settings UI or network behavior.

**Architecture:** Replace the current fetch/save-driven Settings page with a fully static page-level composition. Keep `apps/frontend/src/app/(app)/settings/page.tsx` as a simple assembly layer, move repeated Pencil UI pieces into small presentation components under `apps/frontend/src/components/settings/`, and keep every visible control disabled or otherwise non-interactive.

**Tech Stack:** Next.js 16, React client components, Tailwind CSS v4 utilities, existing `Button` UI primitive, Vitest, Testing Library

---

## File Structure

### Files to Modify

- `apps/frontend/src/app/(app)/settings/page.tsx`
  - Remove all generation settings state, effects, fetch logic, and save handling.
  - Replace the page content with the static Pencil-based composition.
- `apps/frontend/src/app/(app)/settings/page.spec.tsx`
  - Replace the old generation-settings tests with assertions for the static Pencil page.

### Files to Create

- `apps/frontend/src/components/settings/SettingsPanel.tsx`
  - Shared panel shell for the Pencil cards.
- `apps/frontend/src/components/settings/SettingsStaticField.tsx`
  - Static disabled field row for account preferences and delete confirmation input styling.
- `apps/frontend/src/components/settings/SettingsToggleRow.tsx`
  - Disabled notification row with copy and toggle shell.
- `apps/frontend/src/components/settings/settings-content.ts`
  - Static copy/constants for subscription, billing, account fields, notification rows, and danger zone content.

### Files Not Needed Anymore

- Do not create status-message components for loading, success, or error states.
- Do not add any API helper or backend integration for `/api/settings/generation`.

### No Backend Changes

- No changes to `apps/backend/**`
- No Prisma changes
- No routing changes

## Task 1: Replace The Old Settings Tests With Static Pencil Expectations

**Files:**
- Modify: `apps/frontend/src/app/(app)/settings/page.spec.tsx`

- [ ] **Step 1: Rewrite the settings page spec around the new static-only contract**

```tsx
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./page";

const originalFetch = global.fetch;

describe("SettingsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("renders the Pencil-inspired static settings layout", () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    render(<SettingsPage />);

    expect(screen.getByText("ACCOUNT")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(
      screen.getByText("Manage subscription, billing, and account preferences."),
    ).toBeInTheDocument();

    expect(screen.getByText("Current plan")).toBeInTheDocument();
    expect(screen.getByText("Family Keepsake")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Account preferences")).toBeInTheDocument();
    expect(screen.getByText("Notification preferences")).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not render generation settings content from the old page", () => {
    render(<SettingsPage />);

    expect(screen.queryByText("Generation Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading generation settings...")).not.toBeInTheDocument();
    expect(screen.queryByText("Generation settings saved.")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Generation settings could not be loaded."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Generation settings could not be saved."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("openai:gpt-5.4-mini")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reasoning effort")).not.toBeInTheDocument();
    expect(screen.queryByText(/LLM_MODEL_NAME/)).not.toBeInTheDocument();
  });

  it("renders visible controls as disabled UI", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("button", { name: "Manage billing" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download invoices" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete account" })).toBeDisabled();

    const notificationPanel = screen.getByText("Notification preferences").closest("section");
    expect(notificationPanel).not.toBeNull();
    for (const toggle of within(notificationPanel as HTMLElement).getAllByRole("switch")) {
      expect(toggle).toBeDisabled();
    }

    expect(
      screen.getByRole("textbox", { name: "Confirm account deletion" }),
    ).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the settings spec and confirm it fails against the current implementation**

Run: `npm --workspace apps/frontend test -- src/app/'(app)'/settings/page.spec.tsx`

Expected: FAIL because the current page still renders the old generation settings UI and does not match the Pencil-based static structure.

- [ ] **Step 3: Commit the failing test slice**

```bash
git add apps/frontend/src/app/'(app)'/settings/page.spec.tsx
git commit -m "test(frontend): cover static settings redesign"
```

## Task 2: Build Reusable Presentation Components For The Pencil Layout

**Files:**
- Create: `apps/frontend/src/components/settings/SettingsPanel.tsx`
- Create: `apps/frontend/src/components/settings/SettingsStaticField.tsx`
- Create: `apps/frontend/src/components/settings/SettingsToggleRow.tsx`
- Create: `apps/frontend/src/components/settings/settings-content.ts`

- [ ] **Step 1: Create the static content module for Pencil copy**

```ts
export const subscriptionContent = {
  label: "Current plan",
  planName: "Family Keepsake",
  detail:
    "40 generated books per month • final PDF downloads included • renews July 1, 2026",
};

export const billingContent = {
  title: "Billing",
  body: "Visa ending 4242 • next invoice $19.00 on July 1.",
};

export const accountFields = [
  { label: "Parent name", value: "Alicia Hall" },
  { label: "Email", value: "alicia.hall@example.com" },
  { label: "Default language", value: "English" },
];

export const notificationRows = [
  {
    title: "Generation complete",
    body: "Email me when a book is ready to review.",
    enabled: true,
  },
  {
    title: "Review reminders",
    body: "Send follow-ups when a draft waits too long for approval.",
    enabled: true,
  },
  {
    title: "Billing notices",
    body: "Warn me about renewals, receipts, and payment issues.",
    enabled: false,
  },
];

export const dangerZoneContent = {
  title: "Danger zone",
  body:
    "Account deletion removes profiles, generated drafts, review history, and billing access. Final downloaded PDFs remain on your device only.",
  confirmationTitle: "Confirm account deletion",
  confirmationBody: "Type DELETE to confirm. This cannot be undone.",
  confirmationValue: "DELETE",
};
```

- [ ] **Step 2: Create the shared panel shell**

```tsx
import type { PropsWithChildren, ReactNode } from "react";

type SettingsPanelProps = PropsWithChildren<{
  title?: string;
  description?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}>;

export function SettingsPanel({
  title,
  description,
  tone = "default",
  className = "",
  children,
}: SettingsPanelProps) {
  const toneClasses =
    tone === "danger"
      ? "border-destructive/60 bg-destructive/8"
      : "border-border/80 bg-card/95";

  return (
    <section className={`paper-card rounded-[18px] border p-5 ${toneClasses} ${className}`}>
      {title ? <h2 className="text-base font-extrabold text-foreground">{title}</h2> : null}
      {description ? (
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</div>
      ) : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
```

- [ ] **Step 3: Create the static field and toggle row components**

```tsx
// apps/frontend/src/components/settings/SettingsStaticField.tsx
type SettingsStaticFieldProps = {
  label: string;
  value: string;
};

export function SettingsStaticField({ label, value }: SettingsStaticFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-extrabold uppercase tracking-[0.08em] text-foreground/85">
        {label}
      </label>
      <input
        aria-label={label}
        className="h-[42px] w-full rounded-[10px] border border-input bg-input-bg px-3 text-sm text-foreground/90"
        disabled
        readOnly
        value={value}
      />
    </div>
  );
}
```

```tsx
// apps/frontend/src/components/settings/SettingsToggleRow.tsx
type SettingsToggleRowProps = {
  title: string;
  body: string;
  enabled: boolean;
};

export function SettingsToggleRow({ title, body, enabled }: SettingsToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        disabled
        className={`relative h-[26px] w-[46px] rounded-full border ${
          enabled
            ? "border-primary/60 bg-primary/85"
            : "border-border bg-secondary"
        }`}
      >
        <span
          className={`absolute top-[2px] size-[20px] rounded-full bg-white shadow-sm ${
            enabled ? "right-[2px]" : "left-[2px]"
          }`}
        />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the settings spec again**

Run: `npm --workspace apps/frontend test -- src/app/'(app)'/settings/page.spec.tsx`

Expected: FAIL because the new components exist, but `page.tsx` still renders the old generation settings page.

- [ ] **Step 5: Commit the component scaffold**

```bash
git add apps/frontend/src/components/settings
git commit -m "feat(frontend): scaffold static settings components"
```

## Task 3: Rebuild The Settings Page As A Static Pencil Composition

**Files:**
- Modify: `apps/frontend/src/app/(app)/settings/page.tsx`
- Use: `apps/frontend/src/components/settings/SettingsPanel.tsx`
- Use: `apps/frontend/src/components/settings/SettingsStaticField.tsx`
- Use: `apps/frontend/src/components/settings/SettingsToggleRow.tsx`
- Use: `apps/frontend/src/components/settings/settings-content.ts`

- [ ] **Step 1: Replace the current page with the static Pencil layout**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { SettingsStaticField } from "@/components/settings/SettingsStaticField";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";
import {
  accountFields,
  billingContent,
  dangerZoneContent,
  notificationRows,
  subscriptionContent,
} from "@/components/settings/settings-content";

export default function SettingsPage() {
  return (
    <div className="flex max-w-[1140px] flex-col gap-5 px-1">
      <header className="space-y-2">
        <p className="font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
          ACCOUNT
        </p>
        <h1 className="font-display text-5xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-base text-muted-foreground">
          Manage subscription, billing, and account preferences.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SettingsPanel>
          <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
            {subscriptionContent.label}
          </p>
          <h2 className="mt-2 font-display text-[34px] font-semibold text-foreground">
            {subscriptionContent.planName}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {subscriptionContent.detail}
          </p>
        </SettingsPanel>

        <SettingsPanel title={billingContent.title} description={billingContent.body}>
          <div className="space-y-3">
            <Button type="button" disabled>
              Manage billing
            </Button>
            <Button type="button" variant="outline" disabled>
              Download invoices
            </Button>
          </div>
        </SettingsPanel>
      </section>

      <SettingsPanel title="Account preferences">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accountFields.map((field) => (
            <SettingsStaticField
              key={field.label}
              label={field.label}
              value={field.value}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" disabled>
            Cancel
          </Button>
          <Button type="button" disabled>
            Save changes
          </Button>
        </div>
      </SettingsPanel>

      <SettingsPanel title="Notification preferences">
        <div className="space-y-4">
          {notificationRows.map((row) => (
            <SettingsToggleRow
              key={row.title}
              title={row.title}
              body={row.body}
              enabled={row.enabled}
            />
          ))}
        </div>
      </SettingsPanel>

      <SettingsPanel
        title={dangerZoneContent.title}
        tone="danger"
        description={dangerZoneContent.body}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <Button type="button" variant="destructive" disabled>
              Delete account
            </Button>
          </div>

          <div className="rounded-[14px] border border-destructive/60 bg-card p-4">
            <p className="text-sm font-extrabold text-destructive">
              {dangerZoneContent.confirmationTitle}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dangerZoneContent.confirmationBody}
            </p>
            <input
              aria-label="Confirm account deletion"
              className="mt-3 h-9 w-full rounded-[9px] border border-input bg-input-bg px-3 text-sm"
              disabled
              readOnly
              value={dangerZoneContent.confirmationValue}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
}
```

- [ ] **Step 2: Run the focused settings spec and make it pass**

Run: `npm --workspace apps/frontend test -- src/app/'(app)'/settings/page.spec.tsx`

Expected: PASS

- [ ] **Step 3: Run a broader frontend verification slice**

Run: `npm --workspace apps/frontend test -- src/app/'(app)'/settings/page.spec.tsx src/app/'(app)'/page.spec.tsx src/app/'(app)'/books/new/page.spec.tsx`

Expected: PASS for all listed specs.

- [ ] **Step 4: Commit the implemented redesign**

```bash
git add apps/frontend/src/app/'(app)'/settings/page.tsx apps/frontend/src/components/settings apps/frontend/src/app/'(app)'/settings/page.spec.tsx
git commit -m "feat(frontend): redesign settings page from pencil"
```

## Task 4: Final Verification And Handoff

**Files:**
- No new code files

- [ ] **Step 1: Run the frontend build**

Run: `npm --workspace apps/frontend run build`

Expected: PASS with Next.js production build completing successfully.

- [ ] **Step 2: Review the final diff against the spec**

Run: `git diff -- apps/frontend/src/app/'(app)'/settings/page.tsx apps/frontend/src/components/settings apps/frontend/src/app/'(app)'/settings/page.spec.tsx`

Expected: The diff shows a static Pencil-inspired settings layout with disabled controls and no generation-settings behavior.

- [ ] **Step 3: Summarize residual risks before merge**

Document these checks in the execution handoff:

- static Pencil copy may drift if the design file changes later
- button and toggle disabled styling should be spot-checked in-browser after implementation
- the page intentionally no longer reflects backend generation settings endpoints

## Self-Review

- Spec coverage: Task 1 locks the new static contract, Task 2 builds presentation pieces, Task 3 assembles the static page, and Task 4 verifies the final slice.
- Placeholder scan: no `TODO`, `TBD`, or undefined “handle later” steps remain.
- Type consistency: plan consistently uses static presentation components and does not reference removed `llmModel`/`reasoningEffort` UI behavior.
