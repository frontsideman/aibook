# Book Preview, Dashboard, and Project Structure

**Date:** 2026-05-26
**Status:** Draft for Review
**Extends:** 2026-05-15-childrens-book-saas-design.md

## 1. Summary

Redesign the user-facing structure: add a full book creation wizard, HTML preview with per-page editing, PDF finalization pipeline, and a rich dashboard. Organize the frontend into clear sections (dashboard, profiles, book creation, preview, settings).

## 2. Route Structure

| Route | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Gallery of all user books with pagination, search by title, filter by status/style/child |
| `/profiles` | Profiles | CRUD child profiles (already exists, needs UI enhancement) |
| `/books/new` | Book Creation Wizard | Multi-step form: select profile, choose flow, story params, comments, tone, style |
| `/books/[id]/preview` | Preview & Edit | Spread-by-spread book viewer with per-page and global edit fields |
| `/books/[id]` | Book Detail | Completed book view: download PDF, metadata, share |
| `/settings` | Settings | General settings (placeholder for future: subscription, theme, etc.) |

## 3. Data Model Changes

### New Enum: `Tone`
```prisma
enum Tone {
  WARM
  EDUCATIONAL
  PLAYFUL
  MAGICAL
  ADVENTUROUS
}
```

### New Fields on `Book`
- `tone Tone` — narrative tone for generation
- `parentComments String?` — user's initial instructions before generation
- `parentFeedback Json?` — edit requests keyed by page number or `"*"` (global)
- `pdfUrl String?` — S3 URL of final approved PDF
- `approvedAt DateTime?` — timestamp of approval

### New Model: `StoryLibrary`
```prisma
model StoryLibrary {
  id          String   @id @default(cuid())
  title       String   @unique
  description String?
  promptHint  String?
  createdAt   DateTime @default(now())
}
```

Seeded with 100 popular tale titles. Read-only from user perspective. Used in Flow A for the story name autocomplete/selection.

## 4. API Endpoints

> **Note:** Frontend calls use `/api/books/*` prefix (rewritten by Next.js to `BACKEND_URL/*`).  
> Backend routes are defined as `/books/*` (without `/api` prefix).  
> The spec lists backend routes.

### Book Creation
```
POST /books/generate
Body: { childId, type, storyTitle?, userContent?, parentComments, tone, style }
→ 202 { bookId, status: "DRAFT" }
  → enqueues BullMQ job → generates pages → status → REVIEW
```

Changes to existing `POST /books/generate`: currently accepts `{ bookId }`, needs to accept full creation payload and create the Book record before enqueueing.

### Preview
```
GET  /books/:id/preview
→ { book: { id, title, tone, style, status }, pages: [{ pageNumber, textContent, illustrations: [{ url, prompt }] }] }
```

Only accessible when `book.status === REVIEW`. Returns 404 if book is in DRAFT/GENERATING, returns pdfUrl if COMPLETED (redirect to detail page).

### Editing / Feedback
```
PATCH /books/:id/pages/:pageNumber
Body: { textContent? }
→ 200 { page }
  → re-generates illustration for that page after text change

PATCH /books/:id/regenerate
Body: { parentFeedback: string }
→ 202 { bookId }
  → re-runs generation with feedback injected into prompt
```

### Approval & PDF
```
POST /books/:id/approve
→ 200 { pdfUrl }
  → PdfService generates PDF from pages/illustrations
  → StorageService uploads to S3
  → Book.status = COMPLETED, Book.pdfUrl set

GET /books/:id/pdf
→ 302 Redirect to S3 pre-signed URL or stream PDF buffer
```

### Dashboard
```
GET /books?page=1&limit=10&search=&status=&style=&childId=
→ { books: [...], total, page, totalPages }
```

Current `GET /books` returns a flat array. Needs to be updated to return `{ books, total, page, totalPages }` with proper count query. Needs `status`, `childId`, `search` query params added.

### Story Library
```
GET /stories?search=
→ [{ id, title, description }]
```

Used for Flow A autocomplete/selection.

## 5. Book Creation Wizard (`/books/new`)

Three-step form (each step is a section on one page, no separate routes):

**Step 1 — Select Child Profile**
- Dropdown/cards of existing profiles
- Link to `/profiles` to create new one
- Required: must pick one before proceeding

**Step 2 — Choose Story Source**
- Radio: "AI-Adapted (Known Story)" or "Manual Story"
- If AI-Adapted:
  - Text input with autocomplete from StoryLibrary (100 titles)
  - Or type a custom story name
- If Manual:
  - Textarea for user's own story content

**Step 3 — Configure & Generate**
- Textarea: "Parent comments / instructions" (what to change from the original)
- Dropdown: Tone selector (WARM, EDUCATIONAL, PLAYFUL, MAGICAL, ADVENTUROUS)
- Dropdown: Style selector (WATERCOLOR, CARTOON, REALISTIC, PIXAR, SKETCH, MANGA, COMIC)
- Button: "Generate Story" → POST `/books/generate` → (next.config rewrites to backend) → redirect to `/books/[id]/preview`

## 6. Preview Page (`/books/[id]/preview`)

### Layout
- **Header:** Book title, status badge "REVIEW", navigation back to dashboard
- **Spread viewer:** Left/right arrows, one spread (two pages) at a time
- **Page card each:**
  - Illustration (rendered from URL)
  - Text content below
  - "✏️ Edit" button → expands inline textarea for page-specific feedback
- **Footer area:**
  - "Global changes" textarea (changes affecting whole book)
  - "Submit changes" button → PATCH `/api/books/:id/regenerate`
  - "✅ Approve book" button → POST `/api/books/:id/approve`

### States
| State | Behavior |
|---|---|
| No feedback | Show generated content, edit buttons visible |
| Per-page feedback entered | Yellow badge "Page N: pending edit" |
| Submitted for regeneration | Loading spinner, then new preview loaded |
| Approved | Redirect to `/books/[id]` with success message |

## 7. Dashboard (`/`)

### Features
- Grid of book cards (cover-like thumbnail, title, style label, status badge)
- **Search bar** — filters by title (API: `?search=`)
- **Filter chips** — by Status (All, DRAFT, REVIEW, COMPLETED) and Style
- **Pagination** — 10 per page
- Click card → `/books/[id]` (if COMPLETED) or `/books/[id]/preview` (if REVIEW) or nothing if DRAFT/GENERATING
- "Create New Book" button → `/books/new`

### Current page.tsx already has a basic grid. Needs filtering, pagination, and navigation added.

## 8. Backend Implementation Plan

### New/Modified Files

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `Tone` enum, `StoryLibrary` model, new Book fields |
| `src/book/book.controller.ts` | Add preview/approve/regenerate/edit-page endpoints |
| `src/book/book.service.ts` | Add preview/approve/regenerate/edit-page methods + update generate to accept full payload |
| `src/book-generation/book.processor.ts` | Inject tone, parentComments into AI prompts; support regeneration with feedback |
| `src/story-library/story-library.module.ts` | New module: list/search stories |
| `src/story-library/story-library.controller.ts` | GET `/stories?search=` |
| `src/story-library/story-library.service.ts` | Query from StoryLibrary table |
| `src/pdf/pdf.service.ts` | No changes needed (already accepts pages array) |
| `src/storage/storage.service.ts` | Already supports upload (no changes) |
| `src/book/book.module.ts` | If needed, add StoryLibrary module import |

### BookProcessor regeneration logic
Current processor generates story from scratch. For regeneration:
- Accept `parentFeedback` in job data
- Inject feedback into the AI prompt: "The parent requested: {feedback}. Revise the story accordingly."
- If feedback is per-page (coming from `PATCH /books/:id/pages/:pageNumber`), only regenerate that page's text and illustration
- If feedback is global (coming from `PATCH /books/:id/regenerate`), regenerate all pages
- `PATCH /books/:id/pages/:pageNumber` applies changes immediately (synchronous, within timeout)
- `PATCH /books/:id/regenerate` is async — enqueues a new BullMQ job with `parentFeedback` in job data

## 9. Frontend Implementation Plan

### New Files

| File | Purpose |
|---|---|
| `src/app/books/new/page.tsx` | Book creation wizard (client component, 3-step form) |
| `src/app/books/[id]/preview/page.tsx` | Preview & edit page with spread viewer |
| `src/app/books/[id]/page.tsx` | Book detail / download page |
| `src/app/settings/page.tsx` | Settings placeholder |
| `src/components/BookCard.tsx` | Reusable book card component |
| `src/components/Pagination.tsx` | Pagination component |
| `src/components/SpreadViewer.tsx` | Spread/page viewer component for preview |
| `src/components/ProfileSelector.tsx` | Child profile picker for book creation |

### Modified Files

| File | Change |
|---|---|
| `src/app/page.tsx` | Replace simple gallery with full dashboard (search, filters, pagination) |
| `src/app/profiles/page.tsx` | Enhance from placeholder to working CRUD UI |
| `src/app/layout.tsx` | Add navigation header (Dashboard, Profiles, Settings links) |
| `src/mocks/handlers.ts` | Add MSW handlers for new endpoints |

## 10. Story Library Seed Data

100 popular fairy tales / children's stories. Each entry:
- `title`: e.g., "The Little Red Riding Hood"
- `description`: Short summary for the picker UI
- `promptHint`: Key plot points for AI prompt injection

Seeded via Prisma migration or seed script.

## 11. Open Questions
1. Should illustration regeneration be triggered automatically after page text edit, or wait for batch submit?
2. Should StoryLibrary be seeded via migration or a separate seed script?
3. Per-page edits — should parent provide full new text or just a description of changes (AI interprets)?
