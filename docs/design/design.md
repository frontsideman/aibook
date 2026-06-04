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

- Next.js App Router with separate auth and app route groups.
- Tailwind CSS v4 tokens in `globals.css`.
- shadcn-style primitives for buttons, cards, inputs, sidebar, select, dialog, combobox, toast, and badges.
- lucide-react icons for the sidebar navigation.
- A left sidebar app shell with a compact top header and breadcrumb.
- Warm paper-like surfaces using `paper-card`, soft borders, and muted amber/brown OKLCH tokens.
- Light and dark themes through CSS variables and `next-themes`.

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

The current palette is warm and paper-based. Keep it grounded in:

- Background: warm off-white paper.
- Surface: near-white card with slight amber warmth.
- Text: dark warm brown/charcoal.
- Primary: deep sepia/brown for main actions.
- Accent: muted gold/amber for highlights and pending states.
- Success: restrained green for completed/downloadable state.
- Error: clear red only for destructive or failed states.

Avoid turning the product into a single beige block. Balance warm neutrals with purposeful accents: green for completed, amber for review/pending, blue-gray for neutral information, red for destructive actions.

### Typography

Current implementation maps heading and sans tokens to the same font. Future design work should separate them:

- UI text: a highly readable sans-serif.
- Editorial headings: a warmer serif or soft display face with restrained use.
- Book preview text: larger, high-line-height reading text that feels like page copy.

Do not use oversized marketing typography inside dashboard panels. Reserve large type for page titles and book title moments.

### Surfaces

Use `paper-card` for meaningful grouped content: filters, profile cards, book cards, preview feedback blocks, and settings panels. Keep cards purposeful and avoid nesting cards inside cards.

Recommended card feel:

- Soft border.
- Subtle paper-tinted fill.
- Low, diffuse shadow.
- Border radius around the current `rounded-2xl` style unless a component must match shadcn defaults.

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

Design requirements:

- Keep filters prominent but compact.
- Support table-first scanning for many books.
- Preserve card/list mode for more visual browsing.
- Show status, profile, style, type, updated date, and primary action.
- Empty state should point directly to creating a first book.
- Loading and error states should occupy the same content area to avoid layout jumps.

Improvements to explore:

- Add consistent status badge styling in the table.
- Add thumbnail/cover preview column when generated images exist.
- Make view mode labels match behavior: table vs cards, not grid vs list if the current implementation remains table-first.

### Create Book: `/books/new`

Purpose: start a generation flow with profile and story selection.

Design requirements:

- Present as a short step-based flow: profile, story, style/tone, confirmation.
- Child profile selection should be visually strong and clearly selected.
- Story combobox should support search, load-more, empty, loading, and selected states.
- Primary action should stay visible after the user has made valid choices.

Improvements to explore:

- Add style and tone selection to match the product model.
- Show generated-book expectations: page count, output format, and estimated generation state as compact metadata, not marketing copy.
- Provide a no-profile state that routes to profile creation.

### Preview: `/books/:id/preview`

Purpose: review generated pages before approval.

Design requirements:

- Make the spread viewer the visual center.
- Keep page navigation obvious and keyboard-friendly.
- Separate page-level edits from global changes.
- Show pending feedback state clearly before submit.
- Approval should be visually final and more prominent than edit submission, but not easy to trigger accidentally.

Improvements to explore:

- Replace emoji actions with lucide icons and accessible labels.
- Use explicit edit panels instead of toggling hidden textareas through DOM class changes.
- Add a sticky review action bar on larger screens.

### Book Detail: `/books/:id`

Purpose: inspect completed book and download PDF.

Design requirements:

- Treat the top area like a book cover/detail summary.
- Put download as the primary action only when status is `COMPLETED`.
- Keep metadata badges consistent with dashboard and preview.
- Page list should be readable and compact, with illustration thumbnails when available.

Improvements to explore:

- Show PDF availability and approval date.
- Use a real cover preview once images exist.

### Profiles: `/profiles`

Purpose: manage reusable child personalization data.

Design requirements:

- Profile cards should show name, age, gender, and interests.
- Add/edit form should feel like a focused editor, not a raw admin form.
- Destructive delete should be clearly separated and confirmed.
- Empty state should make creating the first profile the obvious next action.

Improvements to explore:

- Move add/edit into a dialog or right-side panel for less vertical jump.
- Replace raw inputs with shadcn `Input`, `Select`, and `Button`.
- Add field labels instead of relying on placeholders.

### Settings: `/settings`

Purpose: subscription and account management.

Design requirements:

- Keep this quiet and utilitarian.
- Subscription state, plan, billing action, and account controls should be grouped into clear sections.
- Avoid decorative treatment here; trust and clarity matter more.

### Auth: `/login`, `/signup`

Purpose: account entry.

Design requirements:

- Centered, narrow card is appropriate.
- Keep copy short and practical.
- Google auth should be visually distinct but not dominant.
- Form labels should be real labels, not paragraph tags.

Improvements to explore:

- Add brand lockup and a subtle book/paper visual background.
- Ensure password placeholders do not imply fixed length.

## Component Rules

- Use shadcn primitives before custom HTML controls.
- Use lucide icons for navigation and common actions.
- Use text buttons only for low-emphasis inline actions.
- Use badges for status, style, tone, and profile metadata.
- Use tables for dense library management and cards for visual browsing.
- Use dialogs or panels for focused edits when the edit form would otherwise push major content down.
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

Use this prompt in Pencil or another AI design tool:

```text
Design a responsive SaaS web app for "aiBook", a parent-facing workspace for creating personalized AI-generated children's books.

Product context:
aiBook lets parents manage child profiles, generate personalized children's books, review generated pages and illustrations, request edits, approve the final book, and download a PDF. The user is an adult parent or caregiver, so the UI should feel warm, trustworthy, editorial, and efficient rather than childish or toy-like.

Design direction:
Create a warm editorial workspace with subtle paper texture, soft borders, quiet shadows, and a restrained off-white / sepia / amber palette balanced with green for completed states, amber for review states, blue-gray for neutral information, and red only for errors or destructive actions. Avoid a generic purple SaaS look. Avoid a marketing landing page. The authenticated dashboard is the primary experience.

Typography:
Use a readable sans-serif for UI and a warmer editorial serif or soft display face for page titles and book moments. Keep dashboard typography compact and scannable. Use larger, more readable type only in book preview/page-reading areas.

Layout:
Use a left sidebar app shell with navigation items: Dashboard, Create Book, Profiles, Settings. Include a compact top header with breadcrumb. Main content should use consistent spacing and responsive layouts. Desktop should feel like a working dashboard. Mobile should collapse navigation cleanly and keep primary actions reachable.

Core screens to design:
1. Dashboard / Book Library
- Page title "My Books"
- Compact filter bar with search, status, style, type, profile, and sort
- Table view for dense scanning with columns: title, profile, type, style, status, updated, action
- Card browsing view with book cover preview, title, child name, status badge, and date
- States for loading, empty library, and API error

2. Create Book
- Step-based flow: select child profile, choose story, select style and tone, confirm generation
- Child profile cards with strong selected state
- Story search combobox with loading, empty, and load-more states
- Clear primary CTA "Create Book"
- No-profile state that points to creating a child profile

3. Review Preview
- Large central book spread viewer using A-series landscape proportions
- Illustration area above or beside readable page text
- Previous/next page controls with page count
- Page-level feedback controls
- Global feedback textarea
- Pending edit indicators
- Primary actions: "Submit changes" and "Approve book"
- Approval should feel final and important but not dangerous

4. Completed Book Detail
- Book cover/detail summary area
- Status, style, tone, child profile, approval/download metadata
- Primary "Download PDF" action
- Compact list of pages with text and thumbnail placeholders

5. Child Profiles
- Grid of child profile cards with name, age, gender, interests
- Add/edit profile form in a dialog or side panel
- Empty state for first profile
- Clear edit and delete actions, with delete visually separated

6. Settings
- Quiet subscription/account management screen
- Sections for subscription status, billing action, and account preferences

7. Auth
- Login and signup cards on a subtle paper-inspired background
- Short, practical copy
- Email/password fields and Google login action

Component requirements:
Use modern SaaS components: sidebar, breadcrumbs, tables, filter bar, cards, badges, buttons, selects, combobox, dialog/side panel, toast, pagination, skeleton loaders, empty states, and error states. Use icon buttons where appropriate with recognizable icons. Keep cards purposeful and do not nest cards inside cards.

Accessibility requirements:
All form controls must have labels. Status color must include text. Ensure visible focus states, keyboard-friendly controls, sufficient contrast, and mobile touch targets around 44px. Include light and dark theme variants.

Deliverables:
Create high-fidelity designs for desktop and mobile for the core screens. Include component states for status badges, selected profile cards, loading, empty, error, disabled, focus, and pending feedback.
```
