# Design System Tokens and Components — Pencil Alignment

## Goal

Align all CSS design tokens, typography, and reusable components with the "aiBook Design System Board" Pencil frame. At the end, verify Login/Signup page visual fidelity against their Pencil frames.

## Scope

1. Add missing design tokens to `globals.css` (colors, radii, shadows, mono font)
2. Load IBM Plex Mono and set up the full type scale
3. Update shadcn `ui/` components to Pencil defaults (44px, 10px radius, 750 weight)
4. Create reusable design system components (StateCard, EmptyState, ErrorState, BrandMark, MetricsCard)
5. Refactor auth forms to use semantic tokens and updated ui primitives
6. Subagent-verify Login/Signup against Pencil frames

Out of scope: Table, Filter bar, Pagination, Book spread viewer, Profile card, Creation flow stepper, Page feedback editor — these are product components for future phases.

## Phase 1 — Design Tokens (globals.css)

### Colors to add

```css
--color-ab-success: #2E7D55;   /* light */
--color-ab-warning: #B7791F;   /* light */
--color-ab-info: #5D7382;      /* light */
--color-ab-font-mono: var(--font-mono);
```

Dark theme:
```css
--color-ab-success: #71C89C;
--color-ab-warning: #E8B75D;
--color-ab-info: #9EB6C4;
```

Wire into shadcn CSS vars in `:root` and `.dark`:

```css
/* :root additions */
--success: #2E7D55;
--success-foreground: #FFFFFF;
--warning: #B7791F;
--warning-foreground: #FFFFFF;
--info: #5D7382;
--info-foreground: #FFFFFF;

/* .dark additions */
--success: #71C89C;
--success-foreground: #171410;
--warning: #E8B75D;
--warning-foreground: #171410;
--info: #9EB6C4;
--info-foreground: #171410;
```

Tailwind v4 will auto-generate `bg-success`, `text-success`, `border-success`, etc. from these.

### Radii

Decouple from `--radius` cascade. Add explicit Pencil radii:

```css
--ab-radius-sm: 6px;    /* tooltips, compact controls */
--ab-radius-md: 10px;   /* buttons, inputs, selects, comboboxes */
--ab-radius-lg: 16px;   /* cards, dialogs, panels */
--ab-radius-book: 22px; /* book covers, spread viewer, login card */
```

### Shadows

```css
--ab-shadow-quiet: 0 10px 24px -14px #3A281418;
--ab-shadow-card: 0 8px 24px -14px oklch(0.22 0.03 56 / 0.45);
--ab-shadow-spread: 0 12px 24px #3A281422;
```

## Phase 2 — Typography

### Font loading (layout.tsx)

Add IBM Plex Mono:
```ts
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});
```

### Type scale (globals.css `@theme inline`)

Add:
```css
--font-mono: var(--font-mono);   /* IBM Plex Mono */
--text-ab-display: 56px;
--text-ab-heading: 34px;
--text-ab-body: 16px;
--text-ab-small: 13px;
--text-ab-caption: 11px;
```

## Phase 3 — shadcn UI Component Updates

All changes follow the **mixed approach**: override defaults to Pencil spec (44px / 10px / 750), add `size="sm"` for compact (32px) where needed.

### button.tsx

| Property | Current | New default | New `sm` |
|----------|---------|-------------|----------|
| Height | h-8 (32px) | px-[22px] py-0 h-[44px] | h-8 (32px) |
| Radius | rounded-lg (~13.6px) | rounded-[10px] | rounded-[10px] |
| Font weight | font-medium (500) | font-extrabold (800) | font-extrabold |
| Font size | text-sm | text-[14px] | text-sm |

Add `loading` prop (`boolean`). When true: button is `disabled`, renders animated pulse dot (`.size-2.5 animate-pulse rounded-full bg-white/70`) + children text, height 42px (slightly shorter than idle state's 44px to match Pencil). Default children: "Continuing...".

### input.tsx

| Property | Current | New default | New `sm` |
|----------|---------|-------------|----------|
| Height | h-8 (32px) | h-[44px] | h-8 (32px) |
| Radius | rounded-lg (~13.6px) | rounded-[10px] | rounded-[10px] |
| Padding | px-3 py-1 | px-3 | px-2 |

Add error styling via `aria-invalid` (destructive border + ring as fallback).

### textarea.tsx

| Property | Current | New default |
|----------|---------|-------------|
| Radius | rounded-lg (~13.6px) | rounded-[10px] |
| Min height | none | min-h-[92px] (Pencil textarea height) |

### badge.tsx

| Property | Current | New default |
|----------|---------|-------------|
| Height | h-5 (20px) | h-7 (28px), px-2.5 |
| Radius | rounded-4xl (pill) | rounded-full (pill, 14px) |
| Font | font-medium, text-xs | font-extrabold, text-[12px] |

Add 4 new variants:
- `success` — border-success text-success
- `warning` — border-warning text-warning
- `info` — border-info text-info (Generating)
- `tone` — border-accent text-accent (gentle tone tags)

### card.tsx

| Property | Current | New default |
|----------|---------|-------------|
| Radius | rounded-xl (~18.4px) | rounded-[16px] |

### select.tsx

| Property | Current | New default | New `sm` |
|----------|---------|-------------|----------|
| Trigger height | h-8 (32px) | h-[44px] | h-8 (32px) |
| Trigger radius | rounded-lg (~13.6px) | rounded-[10px] | rounded-[10px] |

## Phase 4 — Reusable Components

### `BrandMark` (`@/components/ui/brand-mark.tsx`)

Container with `$ab-card` (or `#F5E3C8`) bg, open book SVG icon. Displays "aiBook" in Newsreader. Used in login/signup and sidebar.

Props: `showName?: boolean`, `size?: "sm" | "md" | "lg"`

### `StateCard` (`@/components/ui/state-card.tsx`)

Generation/completed/review state cards.

Props: `variant: "generating" | "review" | "completed"`, `title: string`, `description: string`, `icon?: ReactNode`

Styled with `$ab-info` / `$ab-warning` / `$ab-success` borders and dots.

### `EmptyState` (`@/components/ui/empty-state.tsx`)

Props: `icon: ReactNode`, `title: string`, `description: string`, `action?: ReactNode`

`bg-[#FFF8EE]`, `rounded-[14px]`, icon 32px, title 24px Newsreader 600, body Inter 14px muted.

### `ErrorState` (`@/components/ui/error-state.tsx`)

Props: `message: string`, `action?: ReactNode`

`#FFF1ED` bg, destructive border, `triangle-alert` icon, 12px radius.

### `MetricsCard` (`@/components/ui/metrics-card.tsx`)

Dashboard metric display.

Props: `label: string`, `value: string`, `trend?: string`

110px height, `rounded-[14px]`, value 42px Newsreader 600.

## Phase 5 — Auth Form Refactoring

### LoginForm.tsx

- Replace all raw hex with semantic tokens (`bg-[#FFFDF8]` → `bg-ab-surface`, etc.)
- Replace raw input wrappers with updated shadcn `Input` + lucide icon in `prefix` slot
- Replace raw buttons with updated shadcn `Button` using `loading` state
- Replace error div with `ErrorState` component
- Brand section → `BrandMark` component
- Keep exact card dimensions matching Pencil (430px max-w, 22px border-radius, 28px padding, `$ab-shadow-quiet`)

### SignupForm.tsx

Same transformations. Visual consistency with login.

## Phase 6 — Subagent Verification

Run a subagent that reads both Pencil frames (`kr6ap` — aiBook Login Page, `V9YxE` — aiBook Signup Page) and compares them against the final `LoginForm.tsx` / `SignupForm.tsx`. Reports any remaining visual discrepancies.

## Key Constraints

- All tests must pass after each phase
- Font weights map: Pencil 750 = Tailwind `font-extrabold` (800), Pencil 650 = Tailwind `font-bold` (700), Pencil 500 = `font-medium`, Pencil 400 = `font-normal`
- No raw hex colors outside of `globals.css` token definitions and new component explicit styling
- `cn()` utility throughout
