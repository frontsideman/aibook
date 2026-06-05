# aiBook Design Direction

## Product Context

aiBook is a SaaS workspace for parents to create, review, and download personalized AI-generated children's books. The product combines an operational dashboard with a gentle editorial book-making experience. It should feel trustworthy enough for subscription and family data workflows, but warm enough for a children's book creation tool.

The primary user is a parent or caregiver. Their main jobs are:

- Create and maintain child profiles.
- Generate a book from a known story or custom prompt.
- Review generated pages and illustrations.
- Request page-level or global edits.
- Approve a book and download the final PDF.

The interface should prioritize clarity, confidence, and review speed. It is not a marketing site first; the first authenticated screen is a working library.

## Current Design Baseline

The frontend currently uses:

- Next.js 16 App Router with separate `(auth)` and `(app)` route groups.
- Tailwind CSS v4 via `@import "tailwindcss"` with `@theme inline` configuration in `globals.css`.
- Three-font system: Inter (`--font-sans`) for UI, Newsreader (`--font-display`) for headings and editorial moments, IBM Plex Mono (`--font-mono`) for labels and section eyebrows.
- shadcn-style primitives: button, input, textarea, select, card, badge, dialog, dropdown-menu, sidebar, breadcrumb, separator, skeleton, sonner (toast), and a custom combobox compound component.
- Additional custom components: `BrandMark`, `StateCard`, `SpreadViewer`, `ProfileEditPanel`, `DashboardFilters`, `StatusSummary`, `ViewModeToggle`, `Pagination`, `StoryCombobox`, `CreateBookForm`, `ChildProfileCard`.
- lucide-react icons for navigation and common actions.
- A left sidebar app shell (`AppShell`) with `SidebarProvider`, compact top header, and auto-generated breadcrumbs from `navItems`.
- Warm paper-like surfaces using `paper-card` CSS class, soft borders, and muted amber/brown tokens.
- Light and dark themes through CSS variables and `next-themes`.
- MSW for API mocking in development.

The existing visual language is best described as a warm editorial workspace: paper surfaces, soft shadows, quiet controls, and book-preview areas that use A-series aspect ratios.

## Design Principles

1. Workspace first

The authenticated app should behave like a focused creative operations tool. Avoid landing-page hero sections inside the product. Use dense, scannable layouts for libraries, profile lists, filters, status columns, and review actions.

2. Warm, not childish

The product is about children's books, but the user is an adult. Use warmth through paper texture, illustration previews, gentle color accents, and readable editorial typography. Avoid toy-like buttons, excessive pastels, cartoon clutter, or mascot-heavy UI.

3. Bookmaking should feel tactile

Preview and detail screens should make the book object feel real. Use spread-like proportions, page shadows, clear page navigation, and image/text zones that resemble a children's book layout.

4. Status must be obvious

Book lifecycle states are central to the product: `DRAFT`, `GENERATING`, `REVIEW`, `COMPLETED`. Status badges should be consistent across table rows, cards, preview headers, and detail pages. The user should always know whether a book needs input, is still generating, is ready for review, or is downloadable.

5. Forms should reduce uncertainty

Book creation and child profile flows should make required decisions explicit. Use clear section labels, inline validation, persistent selected states, and submit states. Prefer visible structured choices over long open-ended inputs when the available values are known.

6. Accessible by default

Every control needs semantic labels, visible focus, keyboard access, and sufficient contrast. Icon-only actions need accessible names and tooltips. Status color must be paired with text.

## Visual Style

### Color

The palette is warm and paper-based, defined as CSS custom properties in `globals.css` with `@theme inline` for Tailwind integration.

**Light mode tokens:**

| Token | Hex | Role |
|-------|-----|------|
| `--ab-primary` | `#9B5E1A` | Deep warm brown — primary actions |
| `--ab-accent` | `#D9902F` | Amber/gold — highlights, pending states |
| `--ab-bg` | `#F8F3EA` | Warm cream — page background |
| `--ab-surface` | `#FFFDF8` | Near-white — elevated surfaces |
| `--ab-card` | `#FBF4E8` | Slightly warmer — card fills |
| `--ab-border` | `#E3D5C2` | Warm beige — borders |
| `--ab-input` | `#FFF9F0` | Warm white — input backgrounds |
| `--ab-muted` | `#75695B` | Warm gray — secondary text |
| `--ab-text` | `#2F261D` | Dark brown — primary text |
| `--ab-destructive` | `#B6483D` | Muted red — destructive/error |
| `--ab-focus` | `#3D6C8D` | Steel blue — focus rings |
| `--ab-success` | `#2E7D55` | Forest green — completed/downloadable |
| `--ab-warning` | `#B7791F` | Gold — warning/pending |
| `--ab-info` | `#5D7382` | Slate — neutral information |
| `--ab-avatar` | `#D9A456` | Golden — avatar backgrounds |

**Dark mode tokens:**

| Token | Hex | Role |
|-------|-----|------|
| `--color-ab-bg` | `#171410` | Very dark brown background |
| `--color-ab-card` | `#221D18` | Dark card |
| `--color-ab-surface` | `#221D18` | Dark surface |
| `--color-ab-primary` | `#E2A85F` | Brighter gold (maps to `--primary`) |
| `--color-ab-text` | `#F8EFE3` | Light cream text |

**Semantic status tokens** (available in both themes):

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--success` | `#2E7D55` | `#71C89C` | Completed books, positive states |
| `--warning` | `#B7791F` | `#E8B75D` | Review pending, attention needed |
| `--info` | `#5D7382` | `#9EB6C4` | Neutral information, generating |
| `--destructive` | `#B6483D` | `#F08B80` | Errors, destructive actions |

The body uses a subtle radial gradient background for added warmth. Avoid turning the product into a single beige block. Balance warm neutrals with purposeful accents: green for completed, amber for review/pending, blue-gray for neutral information, red for destructive actions.

### Typography

The three-font system is implemented via `next/font/google` in `layout.tsx`:

- **UI text**: Inter (`--font-sans`) — highly readable sans-serif for body, labels, controls, and all dashboard text.
- **Editorial headings**: Newsreader (`--font-display`) — warmer serif used for page titles, brand name, section headings, and profile names. Creates a literary feel without being decorative.
- **Monospace labels**: IBM Plex Mono (`--font-mono`) — used for section eyebrows (e.g., "YOUR LIBRARY"), status summary labels, and metadata.

Do not use oversized marketing typography inside dashboard panels. Reserve large type for page titles and book title moments. Book preview text should use larger, high-line-height reading that feels like page copy.

### Surfaces

Use `paper-card` for meaningful grouped content: filters, profile cards, book cards, preview feedback blocks, and settings panels. Keep cards purposeful and avoid nesting cards inside cards.

The `paper-card` CSS class applies:

```css
rounded-2xl border border-border/80 bg-card/95 shadow-[0_8px_24px_-14px_oklch(0.22_0.03_56/0.45)]
```

Additional surface conventions:

- **Section headings** use a pattern: mono uppercase eyebrow label + `section-heading` (3xl/4xl font-semibold) + `section-subtitle` (muted foreground text).
- **Custom shadow tokens**: `--ab-shadow-quiet` (subtle), `--ab-shadow-card` (warm brown diffuse), `--ab-shadow-spread` (spread viewer).
- **Custom radius tokens**: `--ab-radius-sm` (6px), `--ab-radius-md` (10px), `--ab-radius-lg` (16px), `--ab-radius-book` (22px for book covers and spread viewer).
- **Button radius**: 10px (`--ab-radius-md`) for consistency across buttons and inputs.
- **Base radius**: 0.85rem (`--radius`) as the Tailwind base.

### Layout

Authenticated pages use the app shell:

- Left sidebar for primary navigation.
- Top header for sidebar toggle, breadcrumb, and page context.
- Main content with `p-4 lg:p-6`.
- Page header with eyebrow, title, and short subtitle where useful.

Use constrained widths for form and review pages. Use full-width, scan-friendly layouts for tables and dashboard filters.

## Page Guidance

### Dashboard: `/`

Purpose: manage the user's book library.

Implemented design:

- Section header: "YOUR LIBRARY" mono eyebrow + "My Books" in font-display + description subtitle.
- **Status summary**: 4 equal-width cards (DRAFT, GENERATING, REVIEW, COMPLETED) showing counts with colored labels.
- **Filter bar**: Rounded container with search input + 5 Select dropdowns (Status, Style, Type, Profile, Sort).
- **View toggle**: Table vs Cards mode, persisted via `?view=` search param.
- **Table view**: Full HTML table with columns: Title, Profile, Type, Style, Status badge, Updated, Action. Alternating row colors.
- **Card view**: 320px-wide cards with gradient placeholder (book emoji), title, child name, status badge, date.
- **States**: Loading skeleton, error with retry, empty state with "Create your first book" link — all occupy the same content area.

Improvements to explore:

- Add thumbnail/cover preview column when generated images exist.
- Unify status badge styling between table and card views.
- Add the unused `EmptyState` and `ErrorState` UI components for consistency.

### Create Book: `/books/new`

Purpose: start a generation flow with profile and story selection.

Implemented design:

- Max-width 4xl centered layout.
- **Step 1 — Profile selection**: 2-column grid of `ChildProfileCard` components with ring highlight on selection. No-profile state shows a link to profile creation.
- **Step 2 — Story selection**: Custom `StoryCombobox` with search, load-more pagination, loading/empty/selected states. Fetches from `/api/stories`.
- Generation settings warning `StateCard` shown when user has custom model preferences.
- Primary "Create Book" submit button with loading state.

Improvements to explore:

- Add style (`BookStyle`) and tone (`Tone`) selection to match the backend enums (currently not in the frontend form).
- Show generated-book expectations: page count, output format, and estimated generation time as compact metadata.
- Consider a step indicator (1-2-3) for visual progress.

### Generating Book: `/books/:id/generating`

Purpose: show generation progress and auto-redirect when complete.

Implemented design:

- Polls the backend every 2 seconds for book status.
- Displays a `StateCard` (generating variant) with info icon and descriptive text.
- On status change to `REVIEW`, redirects to `/books/:id/preview`.
- On status change to `FAILED`, shows error state with recovery options.
- On status change to `COMPLETED`, redirects to `/books/:id`.

Improvements to explore:

- Design a polished visual experience with progress indicators or step visualization.
- Add estimated time or generation step feedback.
- Design the `FAILED` recovery state more clearly.

### Preview: `/books/:id/preview`

Purpose: review generated pages before approval.

Implemented design:

- Title + style/tone badges + REVIEW status badge at top.
- **SpreadViewer**: Central book viewer with illustration area (or gradient placeholder) above readable page text. Previous/next navigation with page count.
- **Per-page feedback**: "Edit this page" button toggles a textarea for page-level comments.
- **Global changes**: Separate textarea for book-wide feedback.
- **Actions**: "Submit changes" (outline) triggers regeneration. "Approve book" (solid primary) transitions to COMPLETED.

Improvements to explore:

- Use explicit edit panels instead of toggling hidden textareas through DOM class changes.
- Add a sticky review action bar on larger screens.
- Show illustration thumbnails once real images are generated.

### Book Detail: `/books/:id`

Purpose: inspect a book and download PDF.

Implemented design:

- Redirects based on status: `REVIEW` → preview, `DRAFT`/`GENERATING`/`FAILED` → generating page.
- Max-width 3xl centered layout.
- Book cover placeholder (gradient + book emoji), title, status/style/tone badges.
- Page list in paper-card containers with text content.
- Download action shown when status is `COMPLETED`.

Improvements to explore:

- Show PDF availability and approval date.
- Use a real cover preview once images exist.
- Add thumbnail illustrations to the page list.

### Profiles: `/profiles`

Purpose: manage reusable child personalization data.

Implemented design:

- "Family" label + "Child Profiles" heading + "Add Profile" button.
- 3-column grid of `ChildProfileCard` components: initials avatar, name (font-display 28px), age/gender, interest chips, edit/delete buttons.
- **Slide-over panel** (`ProfileEditPanel`): Right-aligned panel with overlay. Contains name/age/gender/interests fields, save/cancel actions, and a visually separated delete section at the bottom.

Improvements to explore:

- Add field labels instead of relying on placeholders.
- Add confirmation dialog for destructive delete.
- Improve the empty state for first-time users.

### Settings: `/settings`

Purpose: generation preferences and account management.

Implemented design:

- "Workspace" label + "Settings" heading.
- Single paper-card with "Generation Settings" title.
- Two native `<select>` elements: Model (GPT-5.4 Mini) and Reasoning Effort (Medium).
- Save button with loading state.

Currently minimal. Future work should add subscription state, plan, billing action, and account controls grouped into clear sections. Keep this quiet and utilitarian — trust and clarity matter more than decoration.

### Auth: `/login`, `/signup`

Purpose: account entry.

Implemented design:

- Centered card (max-width 430px, 22px rounded) on the warm gradient background.
- `BrandMark` at top (book SVG + "aiBook" text).
- "Welcome back" heading in font-display 34px (login) or "Create account" (signup).
- Email input with Mail icon, Password input with Lock icon.
- Error alert with destructive border.
- Full-width "Continue" / "Create account" button with loading state.
- "Continue with Google" outline button (non-functional placeholder).
- Forgot password + Create account / Already have account links.

Note: Auth is currently a frontend mock using localStorage sessions. Real backend authentication is planned.

## Component Rules

- Use shadcn primitives before custom HTML controls.
- Use lucide icons for navigation and common actions.
- Use text buttons only for low-emphasis inline actions.
- Use badges for status, style, tone, and profile metadata.
- Use tables for dense library management and cards for visual browsing.
- Use the slide-over panel (`ProfileEditPanel` pattern) for focused edits when the form would otherwise push major content down.
- Use `StateCard` for generating/review/completed status messages.
- Use `SpreadViewer` for book preview with page navigation.
- Keep touch targets at least 44px high where possible.
- Keep interactive states visible: hover, focus, disabled, loading, selected, error.

## Accessibility Requirements

- All form fields must have programmatic labels.
- All icon-only controls must have accessible names.
- Focus indicators must remain visible in light and dark themes.
- Keyboard users must be able to navigate sidebar, filters, comboboxes, pagination, page viewer, and review actions.
- Status colors must always be accompanied by text.
- Tables need captions or accessible names and proper header scopes.
- Error messages should be associated with the relevant form controls.
- Destructive actions need confirmation and clear wording.

## Content Tone

Use concise product language. The UI should sound calm, specific, and adult-facing.

Preferred:

- "Create Book"
- "Review pages"
- "Submit changes"
- "Approve book"
- "Download PDF"
- "Child Profiles"

Avoid:

- Overly playful language.
- Long feature explanations inside the app.
- Marketing-style claims in operational screens.

## Pencil Design Prompt

Use this prompt in Pencil or another AI design tool to generate designs aligned with the current implementation:

```text
Design a responsive SaaS web app for "aiBook", a parent-facing workspace for creating personalized AI-generated children's books.

Product context:
aiBook lets parents manage child profiles, generate personalized children's books, review generated pages and illustrations, request edits, approve the final book, and download a PDF. The user is an adult parent or caregiver, so the UI should feel warm, trustworthy, editorial, and efficient rather than childish or toy-like.

Design direction:
Create a warm editorial workspace with subtle paper texture, soft borders, quiet shadows, and a restrained off-white / sepia / amber palette balanced with green for completed states, amber for review/pending states, blue-gray for neutral information, and red only for errors or destructive actions. Avoid a generic purple SaaS look. Avoid a marketing landing page. The authenticated dashboard is the primary experience.

Typography:
- UI: Inter (sans-serif) for all body text, labels, and controls.
- Headings: Newsreader (serif) for page titles, brand name, and editorial moments.
- Labels: IBM Plex Mono for section eyebrows and status summary labels.
Keep dashboard typography compact and scannable. Use larger type only in book preview/page-reading areas.

Layout:
Use a left sidebar app shell with navigation items: Dashboard, Create Book, Profiles, Settings. Include a compact top header with auto-generated breadcrumb. Main content uses consistent spacing (p-4 lg:p-6). Desktop feels like a working dashboard. Mobile collapses navigation and keeps primary actions reachable.

Color tokens (light mode):
- Primary: #9B5E1A (deep warm brown)
- Accent: #D9902F (amber/gold)
- Background: #F8F3EA (warm cream)
- Card: #FBF4E8 (warm white)
- Border: #E3D5C2 (warm beige)
- Text: #2F261D (dark brown)
- Muted: #75695B (warm gray)
- Success: #2E7D55, Warning: #B7791F, Info: #5D7382, Destructive: #B6483D

Core screens to design:
1. Dashboard / Book Library
- Section eyebrow "YOUR LIBRARY" + title "My Books"
- Status summary: 4 count cards (DRAFT, GENERATING, REVIEW, COMPLETED)
- Compact filter bar with search, status, style, type, profile, and sort dropdowns
- Table view with columns: title, profile, type, style, status badge, updated, action
- Card browsing view with cover preview, title, child name, status badge, date
- Loading skeleton, error with retry, empty state with "Create your first book"

2. Create Book
- Two-step flow: profile selection grid, then story combobox search
- Child profile cards with ring-2 ring-primary selected state
- Story search combobox with loading, empty, load-more, and selected states
- Clear primary CTA "Create Book"
- No-profile state linking to profile creation

3. Generating Book (transitional state)
- Centered StateCard with generating info icon
- Auto-polls and redirects to preview when complete
- Error state for failed generation

4. Review Preview
- Large central SpreadViewer with A-series landscape proportions
- Illustration area above readable page text
- Previous/next page controls with page count
- Per-page feedback textareas toggled by "Edit this page" button
- Global changes textarea
- Actions: "Submit changes" (outline) and "Approve book" (solid primary)

5. Completed Book Detail
- Book cover/detail summary area
- Status, style, tone, child profile badges
- Page list with text content
- "Download PDF" action when status is COMPLETED

6. Child Profiles
- 3-column grid of profile cards with initials avatar, name, age, gender, interest chips
- Slide-over edit panel (right-aligned, overlay) with form fields
- Edit/Delete actions, delete visually separated at bottom
- Empty state for first profile

7. Settings
- Quiet screen with generation settings (model, reasoning effort)
- Save button with loading state

8. Auth
- Centered card on warm gradient background
- BrandMark at top, "Welcome back" heading
- Email/password inputs with icons
- "Continue" button, Google auth placeholder
- Forgot password and create account links

Component requirements:
Use: sidebar, breadcrumbs, tables, filter bar, cards, badges, buttons, selects, combobox, slide-over panel, toast (sonner), pagination, skeleton loaders, StateCard, SpreadViewer. Use icon buttons with lucide icons. Keep cards purposeful and do not nest cards inside cards.

Accessibility requirements:
All form controls must have labels. Status color must include text. Ensure visible focus states (steel blue #3D6C8D), keyboard-friendly controls, sufficient contrast, and mobile touch targets around 44px. Include light and dark theme variants.

Deliverables:
Create high-fidelity designs for desktop and mobile for the core screens. Include component states for status badges, selected profile cards, loading, empty, error, disabled, focus, and pending feedback. Match the existing warm editorial aesthetic.
```

## Current State

This section documents what is implemented versus what remains as prototype/placeholder work.

**Implemented and functional:**

- Full app shell with sidebar, header, breadcrumbs, and light/dark theme.
- Dashboard with filters, table/card views, status summary, pagination, and empty/loading/error states.
- Book creation flow with profile selection and story combobox.
- Book generation polling page with auto-redirect.
- Book preview with SpreadViewer, per-page feedback, global feedback, and approve/submit actions.
- Book detail with status-based redirect logic.
- Child profiles CRUD with card grid and slide-over edit panel.
- Settings page with model/reasoning preferences.
- Auth pages with BrandMark, form validation, and mock localStorage sessions.
- Full Prisma schema with User, ChildProfile, Book, Page, Illustration, StoryLibrary models.
- Backend API for books, child profiles, settings, stories, and payments.
- BullMQ book generation processor with AI service abstraction.

**Prototype / placeholder:**

- Auth is frontend-only mock (localStorage). Backend uses `MockAuthGuard` injecting a static user.
- AI service returns placeholder content (`MockAiService`). No real story or image generation.
- Illustrations are never generated in the current flow.
- PDF generation service exists but is not wired into the generation flow.
- Stripe webhook handler has no signature verification.
- "Sarah K." in sidebar is hardcoded, not connected to auth user.
- Google auth button is non-functional.
- Settings page has only 1 model and 1 effort option.

**Follow-up work tracked in `backlog.md`:**

- Real backend authentication replacing mock.
- Logout behavior in app shell.
- Dynamic book title in breadcrumbs.
- Polished generating page design.
- Illustration generation integration.
- PDF download for completed books.
