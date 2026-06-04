# Book Creation Flow Design

## Summary

Implement the end-to-end text-first book creation flow:

1. User creates a child profile on `Profiles`.
2. User opens `Create Book`, selects a child profile and a story, then submits.
3. App redirects to a dedicated `Generating Book` page.
4. When generation finishes, app redirects to `Preview`.
5. User reviews, edits, or regenerates the book.
6. User approves the book.
7. Approved books appear on the dashboard as completed text-only books.

This iteration does not generate illustrations or PDFs. Global generation settings move to `Settings` and default to `OpenAI GPT-5.4 mini` with `reasoning: medium`.

Backlog item: create a dedicated visual design for the `Generating Book` page after the functional flow is in place.

## Goals

- Make the full happy path work from profile creation through book approval.
- Support async generation with explicit user-facing progress states.
- Store global LLM defaults per user and apply them to all newly created books.
- Preserve the exact generation settings used for each created book.
- Show books on the dashboard across `DRAFT`, `GENERATING`, `REVIEW`, `COMPLETED`, and `FAILED`.

## Non-Goals

- Illustration generation.
- PDF generation and download.
- Multiple model presets or per-book model overrides.
- A final polished visual design for the `Generating Book` page.

## User Flow

### Profiles

- `Profiles` remains the place to create and edit child profiles.
- After successful profile creation, the page refetches and immediately shows the new profile.
- The created profile becomes available to `Create Book` without any manual refresh.

### Create Book

- User opens `/books/new`.
- User selects a child profile.
- User searches and selects a story from `StoryLibrary`.
- User clicks `Create Book`.
- The form uses the user’s global generation settings from `Settings`.
- The form does not expose model or reasoning controls in this iteration.

### Generating Book

- After successful `POST /api/books/generate`, the app redirects to `/books/:id/generating`.
- The page polls the backend for the book’s status.
- While the book is `DRAFT` or `GENERATING`, the page shows a generation-in-progress state.
- The page includes:
  - `Go to Dashboard`
  - `Create Another Book`
- When the book becomes `REVIEW`, the app automatically redirects to `/books/:id/preview`.
- When the book becomes `COMPLETED`, the app automatically redirects to `/books/:id`.
- When the book becomes `FAILED`, the page shows a failed state and recovery actions.

### Preview

- `Preview` is available only for books in `REVIEW`.
- User can:
  - read generated pages,
  - submit per-page edits,
  - submit global regeneration feedback,
  - approve the book.
- Page-level edits remain inline textual adjustments.
- Global feedback triggers regeneration and sends the user back through generation states.

### Approval And Dashboard

- Approving a book changes it to `COMPLETED`.
- `COMPLETED` currently means “approved text-only book”.
- The dashboard shows books in every lifecycle state.
- Dashboard navigation depends on status:
  - `DRAFT` and `GENERATING` open the generating page,
  - `REVIEW` opens preview,
  - `COMPLETED` opens the detail page,
  - `FAILED` opens the generating page with failure messaging.

## Domain Model Changes

### User

Add global generation preferences to `User`:

- `preferredLlmModel`
- `preferredReasoningEffort`

Defaults:

- `preferredLlmModel = "openai:gpt-5.4-mini"`
- `preferredReasoningEffort = "medium"`

These settings are global for the current user and apply to all future book creations unless changed later in `Settings`.

### Book

Add snapshot generation fields to `Book`:

- `llmModel`
- `reasoningEffort`

These fields are written at creation time so each book keeps the exact settings used for its generation, even if the user later changes global defaults.

### Book Status

Extend `BookStatus` to:

- `DRAFT`
- `GENERATING`
- `REVIEW`
- `COMPLETED`
- `FAILED`

Status semantics:

- `DRAFT`: book row exists, job is queued but not yet started.
- `GENERATING`: worker is actively generating pages.
- `REVIEW`: generated pages are ready for parent review.
- `COMPLETED`: book has been approved.
- `FAILED`: generation failed and the user needs a recovery path.

## Backend Design

### Settings API

Add a user-scoped settings surface for generation defaults:

- `GET /settings/generation`
- `PATCH /settings/generation`

Response shape contains:

- `llmModel`
- `reasoningEffort`

Only one model option is enabled for now, but the API should use extendable field names rather than hard-coded booleans.

### Book Creation

`POST /books/generate` continues to accept only book-specific authoring inputs:

- `childId`
- `type`
- `storyTitle`
- optional story metadata already supported by the flow

The backend must:

1. Load the user’s generation settings.
2. Apply defaults if settings were never changed.
3. Create the `Book` with snapshot fields `llmModel` and `reasoningEffort`.
4. Set initial status to `DRAFT`.
5. Enqueue the generation job.

### Book Status Endpoint

Add `GET /books/:id` as an owner-scoped status/detail endpoint.

It should return enough data for:

- generating page polling,
- detail page rendering,
- status-based routing.

Minimum payload:

- `id`
- `title`
- `status`
- `style`
- `tone`
- `child`
- `createdAt`
- `updatedAt`
- `approvedAt`

It may also include pages when useful for the completed detail page, but it should not reuse preview-only semantics.

### Preview Endpoint

`GET /books/:id/preview` stays dedicated to preview data and must only serve books in `REVIEW` or redirect-compatible completed cases already supported by the frontend.

It should no longer act as the generic detail endpoint.

### Generation Worker

Update `BookProcessor`:

1. Load the target book and child profile.
2. Transition the book from `DRAFT` to `GENERATING` when processing starts.
3. Build the story prompt using book, child, and parent feedback data.
4. Call story generation only.
5. Create text pages.
6. Skip all illustration generation.
7. Transition the book to `REVIEW` on success.
8. Transition the book to `FAILED` if generation throws.

If retry behavior is added later, it should build on top of `FAILED` rather than hiding failures behind indefinite loading states.

### Approval

Change `approveBook` behavior:

- Remove PDF generation from the approval path.
- Remove storage upload from the approval path.
- Update the book to `COMPLETED`.
- Set `approvedAt`.

This keeps approval aligned with the current text-only product slice.

## Frontend Design

### Profiles Page

- Keep the current CRUD structure.
- Ensure successful create/edit/delete operations refetch state reliably.
- If the user has no profiles and opens `Create Book`, provide a clear path back to `Profiles`.

### Create Book Page

- Load profiles and generation settings on page load.
- If settings fail to load, use default values and show a visible warning that defaults are being used.
- Keep the create form focused on:
  - child selection,
  - story selection,
  - submit.
- After a successful create response, redirect to `/books/:id/generating`.

### Generating Book Page

Add a new route at `/books/[id]/generating`.

Responsibilities:

- fetch and poll `GET /api/books/:id`,
- render `DRAFT` and `GENERATING` as in-progress,
- redirect to preview on `REVIEW`,
- redirect to detail on `COMPLETED`,
- render a recovery UI on `FAILED`.

Required actions:

- `Go to Dashboard`
- `Create Another Book`
- `Retry` can be deferred unless backend retry is implemented in the same slice.

Backlog note:

- create a dedicated design pass for the page’s final visual treatment.

### Preview Page

- Keep preview editing and regeneration flow.
- Guard against opening preview for `DRAFT`, `GENERATING`, or `FAILED`.
- After approval, redirect to `/books/:id`.

### Detail Page

- Stop using the preview endpoint as its data source.
- Fetch the new owner-scoped `GET /api/books/:id`.
- Show completed book data without assuming PDF availability.

### Settings Page

Replace the placeholder content with a real `Generation Settings` section:

- model selector
- reasoning effort selector
- save action
- success and error states

Allowed model options in this phase:

- `OpenAI GPT-5.4 mini`

Allowed reasoning options in this phase:

- `medium`

The UI should still be structured so more options can be added later without redesigning the page contract.

### Dashboard

- Continue showing all books in the library.
- Make status-based links explicit:
  - generating states open the generating page,
  - review opens preview,
  - completed opens detail.
- Ensure filters and view models understand the new `FAILED` status.

## Error Handling

- If no child profiles exist, `Create Book` should present a clear empty state with a route to `Profiles`.
- If story selection is missing, the form remains invalid and submit stays blocked.
- If a book does not belong to the current user, backend returns `NotFound`.
- If generation fails, the book is marked `FAILED` and the generating page shows a non-loading failure state.
- If settings cannot be loaded, frontend uses the default model and reasoning values and surfaces that fallback to the user.

## Testing Strategy

### Backend

Add or update tests for:

- `createAndGenerate` loads user generation settings and stores snapshot values on the book.
- `GET /books/:id` returns owner-scoped status data.
- `approveBook` transitions `REVIEW -> COMPLETED` without generating a PDF.
- `BookProcessor` transitions `DRAFT -> GENERATING -> REVIEW`.
- `BookProcessor` transitions to `FAILED` when generation throws.
- illustration generation is no longer called during book generation.

### Frontend

Add or update tests for:

- `Create Book` redirects to `/books/:id/generating` after success.
- generating page polls and redirects to preview when status becomes `REVIEW`.
- generating page renders failure state for `FAILED`.
- settings page loads and saves generation settings.
- dashboard routes books by status to the correct destination.
- detail page no longer depends on preview endpoint behavior.

## Implementation Notes

- Use Prisma enums where available instead of raw strings.
- If `reasoningEffort` is not yet represented as a Prisma enum, add one rather than using unconstrained strings.
- Keep the settings API and frontend wording generic enough to support future providers and more model options.
- Avoid unrelated refactoring outside the book flow, settings, and routing corrections required by this feature.

## Backlog

- Design a polished visual experience for the `Generating Book` page after the functional flow lands.
