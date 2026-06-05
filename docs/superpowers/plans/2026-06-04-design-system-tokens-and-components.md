# Design System Tokens and Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align CSS tokens, typography, and shadcn ui components with the Pencil "aiBook Design System Board", then refactor auth forms to use semantic tokens and reusable components.

**Architecture:** Extend `globals.css` @theme with missing colors, radii, and shadows. Update shadcn `ui/*.tsx` component defaults to Pencil spec (44px touch targets, 10px radius, 750 weight, loading states). Create 4 new design system components (BrandMark, StateCard, EmptyState, MetricsCard). Refactor auth forms to use semantic tokens and updated primitives.

**Tech Stack:** Tailwind v4 (CSS-only config), shadcn/radix-nova style, next/font/google, lucide-react, class-variance-authority

---

### Task 1: Add missing design tokens to globals.css

**Files:**
- Modify: `apps/frontend/src/app/globals.css`

- [ ] **Step 1: Add `@theme inline` tokens for missing colors, radii, shadows, and mono font**

Add to the existing `@theme inline` block (after existing `--color-ab-focus` line):

```css
--color-ab-success: #2E7D55;
--color-ab-warning: #B7791F;
--color-ab-info: #5D7382;
--font-mono: var(--font-mono);
--ab-radius-sm: 6px;
--ab-radius-md: 10px;
--ab-radius-lg: 16px;
--ab-radius-book: 22px;
--ab-shadow-quiet: 0 10px 24px -14px #3A281418;
--ab-shadow-card: 0 8px 24px -14px oklch(0.22 0.03 56 / 0.45);
--ab-shadow-spread: 0 12px 24px #3A281422;
```

- [ ] **Step 2: Add `:root` shadcn CSS variables for success, warning, info**

Add to existing `:root` block (after `--chart-5` line):

```css
--success: #2E7D55;
--success-foreground: #FFFFFF;
--warning: #B7791F;
--warning-foreground: #FFFFFF;
--info: #5D7382;
--info-foreground: #FFFFFF;
```

- [ ] **Step 3: Add `.dark` overrides for success, warning, info**

Add to existing `.dark` block (after `--chart-5` line):

```css
--success: #71C89C;
--success-foreground: #171410;
--warning: #E8B75D;
--warning-foreground: #171410;
--info: #9EB6C4;
--info-foreground: #171410;
```

- [ ] **Step 4: Verify CSS compiles**

Run: `npm run build`
Expected: Build succeeds with no CSS errors.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/globals.css
git commit -m "feat(design): add missing design tokens (success, warning, info, radii, shadows, mono font)"
```

---

### Task 2: Load IBM Plex Mono and set up type scale

**Files:**
- Modify: `apps/frontend/src/app/layout.tsx`

- [ ] **Step 1: Add IBM Plex Mono font import and variable**

In `apps/frontend/src/app/layout.tsx`, add the import and variable:

```typescript
import { IBM_Plex_Mono, Inter, Newsreader } from "next/font/google";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});
```

Add `ibmPlexMono.variable` to the `className` on `<html>`:

```typescript
className={`${inter.variable} ${newsreader.variable} ${ibmPlexMono.variable} font-sans`}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/app/layout.tsx
git commit -m "feat(design): add IBM Plex Mono font for captions and labels"
```

---

### Task 3: Update button.tsx — Pencil defaults (44px, 10px radius, 750 weight, loading state)

**Files:**
- Modify: `apps/frontend/src/components/ui/button.tsx`

- [ ] **Step 1: Change default size to 44px, update size variants**

Replace the `size` variants in `buttonVariants`:

```typescript
size: {
  default:
    "h-[44px] gap-1.5 px-[22px] rounded-[10px] text-[14px] font-extrabold has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  sm: "h-8 gap-1.5 px-2.5 rounded-[10px] text-sm font-extrabold has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  xs: "h-6 gap-1 rounded-[min(var(--ab-radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
  lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  icon: "size-[44px] rounded-[10px]",
  "icon-xs":
    "size-6 rounded-[min(var(--ab-radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
  "icon-sm":
    "size-7 rounded-[min(var(--ab-radius-md),10px)] in-data-[slot=button-group]:rounded-lg",
  "icon-lg": "size-9",
},
```

- [ ] **Step 2: Add `loading` prop to Button**

Update the Button function to accept and render a loading state:

```typescript
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="size-2.5 animate-pulse rounded-full bg-white/70" />
          {children || "Continuing..."}
        </span>
      ) : (
        children
      )}
    </Comp>
  )
}
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: TypeScript compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/ui/button.tsx
git commit -m "feat(design): update button to Pencil defaults (44px, 10px radius, extrabold, loading state)"
```

---

### Task 4: Update input.tsx — Pencil defaults (44px, 10px radius)

**Files:**
- Modify: `apps/frontend/src/components/ui/input.tsx`

- [ ] **Step 1: Change default input styles to Pencil spec**

Replace the className in `Input`:

```typescript
"h-[44px] w-full min-w-0 rounded-[10px] border border-input bg-transparent px-3 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ui/input.tsx
git commit -m "feat(design): update input to Pencil defaults (44px height, 10px radius)"
```

---

### Task 5: Update textarea.tsx and select.tsx — Pencil radii

**Files:**
- Modify: `apps/frontend/src/components/ui/textarea.tsx`
- Modify: `apps/frontend/src/components/ui/select.tsx`

- [ ] **Step 1: Update textarea.tsx radius and min-height**

Replace `rounded-lg` with `rounded-[10px]` and add `min-h-[92px]`:

```typescript
"flex field-sizing-content min-h-[92px] w-full rounded-[10px] border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none ..."
```

- [ ] **Step 2: Update select.tsx trigger radius and height**

In `SelectTrigger`, change `rounded-lg` to `rounded-[10px]` and `data-[size=default]:h-8` to `data-[size=default]:h-[44px]`:

```typescript
"flex w-fit items-center justify-between gap-1.5 rounded-[10px] border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap ... data-[size=default]:h-[44px] data-[size=sm]:h-7 ..."
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/ui/textarea.tsx apps/frontend/src/components/ui/select.tsx
git commit -m "feat(design): update textarea and select to Pencil radii (10px) and heights"
```

---

### Task 6: Update badge.tsx — Pencil defaults (28px, pill, status variants)

**Files:**
- Modify: `apps/frontend/src/components/ui/badge.tsx`

- [ ] **Step 1: Update base badge styles and add status variants**

Replace entire file content:

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-[12px] font-extrabold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "border-success/30 bg-success/10 text-success",
        warning:
          "border-warning/30 bg-warning/10 text-warning",
        info:
          "border-info/30 bg-info/10 text-info",
        tone:
          "border-accent/30 bg-accent/10 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ui/badge.tsx
git commit -m "feat(design): update badge to Pencil defaults (28px, pill, extrabold, status variants)"
```

---

### Task 7: Update card.tsx — Pencil radius

**Files:**
- Modify: `apps/frontend/src/components/ui/card.tsx`

- [ ] **Step 1: Change card radius to 16px**

Replace `rounded-xl` (appears once in the base Card) with `rounded-[16px]`:

```typescript
"group/card flex flex-col gap-4 overflow-hidden rounded-[16px] bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 ..."
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ui/card.tsx
git commit -m "feat(design): update card radius to Pencil 16px"
```

---

### Task 8: Create BrandMark component

**Files:**
- Create: `apps/frontend/src/components/ui/brand-mark.tsx`

- [ ] **Step 1: Create BrandMark component**

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function BrandMark({
  className,
  showName = true,
  size = "md",
}: {
  className?: string;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: { box: "size-[26px]", rounded: "rounded-[7px]", icon: 14, text: "text-[20px]" },
    md: { box: "size-[34px]", rounded: "rounded-[9px]", icon: 18, text: "text-[27px]" },
    lg: { box: "size-[44px]", rounded: "rounded-[11px]", icon: 24, text: "text-[34px]" },
  }

  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex items-center justify-center bg-[#9B5E1A]", s.box, s.rounded)}>
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5Z" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        </svg>
      </div>
      {showName && (
        <span
          className={cn(
            "font-display font-semibold text-[#2F261D]",
            s.text,
          )}
        >
          aiBook
        </span>
      )}
    </div>
  )
}

export { BrandMark }
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ui/brand-mark.tsx
git commit -m "feat(design): add BrandMark reusable component"
```

---

### Task 9: Create StateCard, EmptyState, MetricsCard components

**Files:**
- Create: `apps/frontend/src/components/ui/state-card.tsx`
- Create: `apps/frontend/src/components/ui/empty-state.tsx`
- Create: `apps/frontend/src/components/ui/error-state.tsx`
- Create: `apps/frontend/src/components/ui/metrics-card.tsx`

- [ ] **Step 1: Create StateCard component**

```typescript
import * as React from "react"
import { Circle, CircleAlert, CircleCheck } from "lucide-react"

import { cn } from "@/lib/utils"

const variantConfig = {
  generating: {
    border: "border-info/40",
    dot: "text-info",
    Icon: Circle,
  },
  review: {
    border: "border-warning/40",
    dot: "text-warning",
    Icon: CircleAlert,
  },
  completed: {
    border: "border-success/40",
    dot: "text-success",
    Icon: CircleCheck,
  },
}

function StateCard({
  variant,
  title,
  description,
  className,
}: {
  variant: "generating" | "review" | "completed";
  title: string;
  description: string;
  className?: string;
}) {
  const cfg = variantConfig[variant]
  const { Icon } = cfg

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[14px] border bg-card p-[14px]",
        cfg.border,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", cfg.dot)} />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-extrabold text-foreground">{title}</span>
        <span className="text-[13px] leading-snug text-muted-foreground">
          {description}
        </span>
      </div>
    </div>
  )
}

export { StateCard }
```

- [ ] **Step 2: Create EmptyState component**

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[14px] bg-[#FFF8EE] p-8 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>
      <h3 className="font-display text-2xl font-semibold text-foreground">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export { EmptyState }
```

- [ ] **Step 3: Create ErrorState component**

```typescript
import * as React from "react"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function ErrorState({
  message,
  action,
  className,
}: {
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[12px] border border-destructive bg-[#FFF1ED] p-3",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-destructive">{message}</span>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

export { ErrorState }
```

- [ ] **Step 4: Create MetricsCard component**

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function MetricsCard({
  label,
  value,
  trend,
  className,
}: {
  label: string;
  value: string;
  trend?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-1 rounded-[14px] border border-border/80 bg-card p-5",
        className,
      )}
      style={{ height: "110px" }}
    >
      <span className="font-display text-[42px] font-semibold leading-none text-foreground">
        {value}
      </span>
      <span className="text-[13px] text-muted-foreground">
        {label}
        {trend && <span className="ml-1.5 text-[13px] text-success">{trend}</span>}
      </span>
    </div>
  )
}

export { MetricsCard }
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/ui/state-card.tsx apps/frontend/src/components/ui/empty-state.tsx apps/frontend/src/components/ui/error-state.tsx apps/frontend/src/components/ui/metrics-card.tsx
git commit -m "feat(design): add StateCard, EmptyState, ErrorState, MetricsCard components"
```

---

### Task 10: Refactor LoginForm.tsx — use semantic tokens and updated primitives

**Files:**
- Modify: `apps/frontend/src/components/auth/LoginForm.tsx`
- Modify: `apps/frontend/src/app/(auth)/auth-pages.spec.tsx`

- [ ] **Step 1: Rewrite LoginForm to use updated ui primitives and semantic tokens**

Replace the file content:

```typescript
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Lock, Mail, X } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const { loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email) || password.trim().length === 0) {
      setError('Check your email and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await loginDemo({ email, name: 'Demo Parent' });
      router.replace('/');
    } catch {
      setError('Check your email and password.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[430px] rounded-[22px] border border-border bg-ab-surface p-7 shadow-[0_16px_34px_-14px_#3A28141A]">
      <BrandMark className="mb-[18px]" />

      <h1 className="font-display text-[34px] font-semibold text-foreground">
        Welcome back
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to continue your books.
      </p>

      <form className="mt-[18px] space-y-[14px]" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
              }}
              placeholder="parent@example.com"
              className="pl-9"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              placeholder="Enter your password"
              className="pl-9"
              autoComplete="current-password"
              disabled={isSubmitting}
              aria-invalid={!!error}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-[12px] border border-destructive bg-destructive/10 p-3">
            <X className="size-4 shrink-0 text-destructive" />
            <span className="text-xs font-bold text-destructive" role="alert">
              {error}
            </span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
        >
          Continue
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full opacity-50"
          disabled
          aria-label="Continue with Google"
        >
          <span className="text-[15px] font-extrabold text-primary">G</span>
          Continue with Google
        </Button>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-[13px] font-extrabold text-primary opacity-50"
            disabled
          >
            Forgot password?
          </Button>
          <Link
            href="/signup"
            className="text-[13px] font-extrabold text-primary"
          >
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Run existing tests to verify they still pass**

Run: `npm run test -- --filter=frontend`
Expected: All auth pages tests pass. The tests check for `aiBook`, `Welcome back`, `Continue`, `Continue with Google`, `Continuing...` — these still exist.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/auth/LoginForm.tsx
git commit -m "feat(design): refactor LoginForm to use semantic tokens and updated ui primitives"
```

---

### Task 11: Refactor SignupForm.tsx — use semantic tokens and updated primitives

**Files:**
- Modify: `apps/frontend/src/components/auth/SignupForm.tsx`

- [ ] **Step 1: Rewrite SignupForm with semantic tokens and primitives**

Replace the file content:

```typescript
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Lock, Mail, User, X } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SignupForm() {
  const router = useRouter();
  const { signupDemo } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      name.trim().length === 0 ||
      !isValidEmail(email) ||
      password.trim().length < 8
    ) {
      setError('Complete all fields with a valid password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await signupDemo({ name: name.trim(), email });
      router.replace('/');
    } catch {
      setError('Complete all fields with a valid password.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[430px] rounded-[22px] border border-border bg-ab-surface p-7 shadow-[0_16px_34px_-14px_#3A28141A]">
      <BrandMark className="mb-[18px]" />

      <h1 className="font-display text-[34px] font-semibold text-foreground">
        Create your account
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Start creating personalized keepsakes.
      </p>

      <form className="mt-[18px] space-y-[14px]" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-foreground">
            Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError('');
              }}
              placeholder="Jane Doe"
              className="pl-9"
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
              }}
              placeholder="parent@example.com"
              className="pl-9"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-extrabold text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              placeholder="Create a password"
              className="pl-9"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={!!error}
            />
          </div>
          <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-[12px] border border-destructive bg-destructive/10 p-3">
            <X className="size-4 shrink-0 text-destructive" />
            <span className="text-xs font-bold text-destructive" role="alert">
              {error}
            </span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
        >
          Create account
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">Already have an account?</span>
          <Link href="/login" className="font-extrabold text-primary">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

Run: `npm run test -- --filter=frontend`
Expected: All auth pages tests pass. `Creating account...` test checks for exact button name — the `Button` with `loading` prop still renders children text, so this passes.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/auth/SignupForm.tsx
git commit -m "feat(design): refactor SignupForm to use semantic tokens and updated ui primitives"
```

---

### Task 12: Full project build and test

**Files:**
- (no changes)

- [ ] **Step 1: Build entire project**

Run: `npm run build`
Expected: Turbo build succeeds for database > backend > frontend.

- [ ] **Step 2: Run all frontend tests**

Run: `npm run test -- --filter=frontend`
Expected: All tests pass.

- [ ] **Step 3: Verify no raw hex values remain in auth forms**

Search for raw hex patterns in auth components:
Run: `rg '#[0-9A-Fa-f]{6}' apps/frontend/src/components/auth/`
Expected: No matches (only semantic tokens remain).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: full build and test pass after design system alignment"
```

---

### Task 13: Subagent — verify Login/Signup against Pencil frames

**Files:**
- (subagent reads Pencil frames and compares)

- [ ] **Step 1: Dispatch a subagent to verify visual alignment**

The subagent will:
1. Read Pencil frame `kr6ap` (aiBook Login Page) with readDepth=3, resolveInstances=true, resolveVariables=true
2. Read Pencil frame `V9YxE` (aiBook Signup Page) with readDepth=3, resolveInstances=true, resolveVariables=true
3. Compare against final `LoginForm.tsx` and `SignupForm.tsx`
4. Report any remaining discrepancies in spacing, colors, typography, component sizing

Use a `general` subagent for this task since it needs Pencil tool access.

- [ ] **Step 2: Fix any reported discrepancies**

Apply fixes as needed based on subagent report.

- [ ] **Step 3: Run full test suite**

Run: `npm run test -- --filter=frontend`
Expected: All pass.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "fix: align auth forms with Pencil frames per verification"
```
