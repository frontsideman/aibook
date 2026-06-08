# Backlog Reference

## Source
Full backlog: [`../backlog.md`](../backlog.md)

## Active Items

### Breadcrumbs
- Show real book title in breadcrumb instead of "Book"
- Fetch title from backend for `/books/[id]` routes
- Pass title to `PageBreadcrumb` or use React context/SWR hook

### Auth Follow-up (High Priority)
- Current: Backend `MockAuthGuard` injects mock user; frontend has duplicate mock session
- Target: Remove frontend mock auth → backend as source of truth
- Tasks:
  1. Add explicit logout entry point in app shell
  2. Replace frontend mock auth with backend-backed auth
  3. Re-evaluate `(auth)`/`(app)` guard boundaries

### Book Creation Flow Follow-up
- Design polished `Generating Book` page experience
- Define layout, hierarchy, copy for loading state
- Design `REVIEW` handoff cues and `FAILED` recovery state
- Keep compatible with existing polling flow

## Update Rule
When adding/removing/updating backlog items:
1. Update `../backlog.md` (source of truth)
2. Update this file (`agents/AGENTS-backlog.md`) to reflect changes