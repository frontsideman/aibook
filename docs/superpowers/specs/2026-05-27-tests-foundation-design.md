# Tests Foundation Design (Baseline, Risk-first)

Date: 2026-05-27
Status: Approved for spec write
Scope: Sub-project 5 from stability roadmap

## 1. Goal and Success Criteria

Define a baseline automated testing foundation that covers the highest-risk functional paths across backend, frontend, and one end-to-end flow.

Success criteria:
1. Testing contract is defined by layer (backend, frontend, e2e).
2. Priority test cases are explicitly listed for each layer.
3. One minimal happy-path e2e flow is part of the baseline contract.

## 2. Scope

In scope:
- Baseline strategy and priority test cases
- Backend critical module coverage targets
- Frontend smoke test scope with mock-based API behavior
- Minimal end-to-end happy path contract

Out of scope:
- Full exhaustive test catalog
- CI runtime optimization strategy
- Broad edge-case e2e matrix

## 3. Testing Contract

### 3.1 Backend (unit + integration priority)

Priority modules/flows:
1. `BookController`
- user scoping/access behavior
- status transition handling
- input validation behavior

2. `PdfService`
- sequential page processing behavior
- error handling for image fetch and PDF stream pipeline

3. Queue flow (`book-generation` processor)
- enqueue to process progression
- status update lifecycle
- failure path handling

### 3.2 Frontend (runner + smoke baseline)

Baseline requirements:
- Establish and use a frontend test runner (Vitest or Jest).
- Cover critical screens with smoke tests:
  1. dashboard renders without crash
  2. wizard renders without crash
  3. preview page renders without crash
- Include basic user interactions against mocked API responses (MSW):
  - create flow trigger
  - status fetch/render
- Cover at least core loading and error-state rendering paths.

### 3.3 E2E (minimal happy path)

Single baseline scenario:
1. Create a book.
2. Trigger generation.
3. Observe resulting status/progress state and accessible result view.

This pass intentionally includes one happy path only.

## 4. Error Flow and Quality Interpretation

- Failing backend critical tests indicate blocking functional risk.
- Missing frontend smoke coverage on a critical screen indicates unacceptable baseline gap.
- Missing e2e happy path indicates integration gap in release confidence.

## 5. Risks and Mitigations

Risk: Broad test scope may slow initial implementation.
- Mitigation: baseline is intentionally narrow and risk-prioritized.

Risk: E2E instability in prototype environment.
- Mitigation: start with one deterministic happy path, defer edge cases.

Risk: Frontend smoke tests produce false confidence without interaction checks.
- Mitigation: require basic MSW-backed interaction assertions, not render-only checks.

## 6. Acceptance Checklist

- [ ] Backend priority coverage areas are defined for BookController, PdfService, and queue processor flow.
- [ ] Frontend test runner requirement is defined.
- [ ] Frontend smoke scope includes dashboard, wizard, preview.
- [ ] Frontend baseline includes basic MSW-backed interaction checks.
- [ ] One minimal e2e happy path is defined as baseline contract.
