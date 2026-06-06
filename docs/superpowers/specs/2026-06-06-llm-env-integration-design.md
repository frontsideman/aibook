# LLM Env Integration Design

## Summary

Replace the backend mock story generator with a real env-configured LLM integration while preserving the current book-generation flow, queue lifecycle, and service boundaries.

This iteration uses one active LLM provider defined entirely by backend environment variables:

- `LLM_API_URL`
- `LLM_API_KEY`
- `LLM_MODEL_NAME`

The database continues to store `llmModel` on each book, but for now that field records the active env-configured model that was actually used. It does not select among multiple providers yet.

## Goals

- Generate book text through a real LLM API instead of `MockAiService`.
- Keep `BookProcessor` and the rest of the book domain isolated from provider-specific HTTP details.
- Fail backend startup early when required LLM environment variables are missing or invalid.
- Preserve current lifecycle states: `DRAFT`, `GENERATING`, `REVIEW`, `FAILED`, `COMPLETED`.
- Keep frontend failure handling generic: users only need to know generation failed and can try again.

## Non-Goals

- Multi-provider routing by `book.llmModel`.
- Frontend display of provider-specific error details.
- Persisting raw LLM error payloads in the database.
- Illustration generation changes.
- PDF generation changes.

## Approach Options

### Recommended: `AiService` + `LlmGateway` + validated env config

- Keep `AiService` as the application-facing abstraction.
- Add a dedicated `LlmGateway` responsible for outbound HTTP requests.
- Add backend env validation for `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL_NAME`.
- Keep the current queue and processor behavior, but swap the implementation beneath `AiService`.

Why this is recommended:

- preserves clean separation between domain logic and external API integration
- supports future provider expansion without reworking the processor
- keeps the current service contract stable while removing the mock backend behavior

### Rejected: direct HTTP calls inside `BookProcessor`

Reason rejected:

- couples domain generation flow to transport details
- makes future provider expansion harder
- increases test complexity in the wrong layer

### Rejected: repurposing `MockAiService` to call the real API

Reason rejected:

- naming becomes misleading
- keeps provider logic hidden behind a mock-oriented implementation
- creates extra cleanup work in the next LLM iteration

## Backend Design

### Module Boundaries

`apps/backend/src/ai/` should be structured around clear responsibilities:

- `AiService`: stable facade used by the rest of the application
- `LlmGateway`: outbound HTTP integration with the active LLM API
- config helper or provider: validated access to `LLM_*` settings
- interface types: shared request/response contracts within the AI module

`AiModule` should stop binding `MockAiService` as the default story provider. Instead, it should construct the real env-driven path:

- `BookProcessor` -> `AiService` -> `LlmGateway`

`BookProcessor` must not know:

- provider URL
- auth header details
- response JSON shape
- transport error handling specifics

Those details belong entirely to `LlmGateway`.

### Environment Configuration

The backend must treat the following variables as required:

- `LLM_API_URL`
- `LLM_API_KEY`
- `LLM_MODEL_NAME`

Validation requirements:

- `LLM_API_URL` must be a valid absolute URL
- `LLM_API_KEY` must be a non-empty string
- `LLM_MODEL_NAME` must be a non-empty string

Backend startup should fail immediately when any required value is absent or invalid. Runtime generation should not discover missing configuration late.

The existing `.env.example` remains the source of local setup expectations.

### AI Service Contract

Keep the current application-facing method:

```ts
generateStory(prompt: string, options: StoryGenerationOptions): Promise<string>
```

Behavior in this iteration:

- `prompt` remains the generated story prompt from the processor
- `options.reasoningEffort` continues to flow through the application contract
- `options.model` is no longer used for provider selection

Instead, `LlmGateway` always uses `LLM_MODEL_NAME` from env as the effective model for the outbound request.

This preserves the current call sites while making the active provider selection unambiguous.

### Book Snapshot Behavior

When a new book is created:

- the backend should read the active configured model from env
- `book.llmModel` should store that configured model value
- `book.reasoningEffort` should continue to snapshot the per-book reasoning setting already supported by the domain

This means the persisted book record reflects the model actually used for generation in this single-provider phase.

### Generation Flow

Book generation flow remains structurally the same:

1. `POST /books/generate` creates the book in `DRAFT`
2. the backend snapshots the active env model into `book.llmModel`
3. the queue enqueues `generate-book`
4. `BookProcessor` loads the book and child
5. `BookProcessor` transitions the book to `GENERATING`
6. `BookProcessor` builds the prompt
7. `AiService` calls `LlmGateway`
8. `LlmGateway` performs the HTTP request to the external LLM API
9. on success, pages are created and the book transitions to `REVIEW`
10. on failure, the book transitions to `FAILED`

The queue job should still rethrow the underlying error after updating the book status so the worker logs remain useful for debugging.

### External API Response Handling

`LlmGateway` should be the only place that knows how to translate the provider response into a plain story string.

Responsibilities:

- send the configured auth header
- send the configured model name
- include the prompt in the provider request shape
- validate that the response contains usable story text
- throw a normalized backend error when the provider returns:
  - non-2xx status
  - empty text
  - structurally invalid JSON for the expected response shape

The rest of the application should only receive either:

- generated story text
- an exception

### Failure Handling

On LLM failure:

- the processor updates the book to `FAILED`
- the processor rethrows the error for queue logging
- the backend does not persist raw provider error details in the database
- the frontend continues to show a generic retry message

This keeps the current product behavior simple while preserving enough operational visibility in backend logs.

## Frontend Impact

No new frontend API contract is required for this iteration.

Expected frontend behavior remains:

- generating route polls backend status
- `FAILED` is treated as a generic failure state
- UI messaging asks the user to try again later or retry the flow

The frontend must not depend on provider-specific failure payloads.

## Testing

### Backend Tests

Add or update coverage for:

- env validation fails when `LLM_API_URL`, `LLM_API_KEY`, or `LLM_MODEL_NAME` is missing or invalid
- `LlmGateway` sends the expected request shape to the configured endpoint
- `LlmGateway` extracts story text from a valid provider response
- `LlmGateway` throws on non-2xx responses
- `LlmGateway` throws on empty or invalid response payloads
- `BookService.createAndGenerate` snapshots `book.llmModel` from active env config
- `BookProcessor` marks the book `REVIEW` after successful story generation
- `BookProcessor` marks the book `FAILED` when the gateway throws

### Frontend Tests

No new frontend protocol tests are required if the API contract does not change.

If any existing tests assume mock-generated text content or hard-coded model defaults, update them to align with env-driven snapshot behavior and generic failure messaging.

## Impacted Areas

Likely files or modules affected:

- `apps/backend/src/ai/ai.module.ts`
- `apps/backend/src/ai/ai.service.ts`
- `apps/backend/src/ai/ai.provider.interface.ts`
- new `apps/backend/src/ai/*gateway*` and config files
- `apps/backend/src/book/book.service.ts`
- `apps/backend/src/book-generation/book.processor.ts`
- backend config/bootstrap validation files
- `apps/backend/.env.example`
- backend AI and processor test files

## Acceptance Criteria

1. Story generation no longer uses `MockAiService` in normal backend runtime.
2. Backend startup fails fast when required `LLM_*` configuration is missing or invalid.
3. The active model used for generation comes from backend env config.
4. New books store the active configured model in `book.llmModel`.
5. `BookProcessor` stays free of provider-specific HTTP and response parsing details.
6. Successful generations still end in `REVIEW`.
7. Failed external LLM requests still end in `FAILED`.
8. Frontend failure handling remains generic and does not require detailed provider errors.
