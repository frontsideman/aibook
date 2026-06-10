# tRPC Integration Plan for aiBook

## Current State

| Layer | What exists |
|-------|-------------|
| Backend | NestJS 10, 5 REST controllers, `MockAuthGuard`, `SubscriptionGuard`, no data validation library (no Zod) |
| Frontend | Next.js 16 App Router, native `fetch` in `useEffect` hooks, no React Query/SWR, no centralized API client |
| Communication | Next.js rewrite proxy `/api/*` → backend:3001 |

## Two Integration Approaches

### Option A: `nestjs-trpc` library (Recommended)

Uses the [`nestjs-trpc`](https://github.com/kevinedry/nestjs-trpc) adapter that integrates tRPC into NestJS via decorators. Routers are NestJS providers with DI, context/middleware participate in Nest's container.

**Pros:**
- Preserves existing NestJS architecture — REST controllers continue working alongside tRPC
- Routers get full DI (inject `BookService`, `PrismaService`, etc.)
- `@Router()`, `@Query()`, `@Mutation()` decorators feel native to NestJS
- Auto-generates `AppRouter` type for the frontend
- Auth middleware can wrap existing `MockAuthGuard` logic

**Cons:**
- Additional dependency (`nestjs-trpc`)
- Routers are a parallel API surface to existing controllers (two ways to access the same data during migration)
- Library maintenance risk (285 code snippets, High reputation, but smaller community than core tRPC)

### Option B: Standalone tRPC on Next.js backend

Add `initTRPC` + `fetchRequestHandler` directly, either as a tRPC handler inside the NestJS app or as a separate Next.js API route.

**Pros:**
- No extra NestJS library dependency
- Full control over router structure

**Cons:**
- Must manually wire DI (no Nest container integration)
- More boilerplate to connect routers to existing services
- Two separate server processes if tRPC goes on the Next.js side

### Recommended: Option A (`nestjs-trpc`)

The project is a NestJS app. `nestjs-trpc` was built for exactly this — adding tRPC routers as NestJS providers with full DI support. It's the path of least resistance.

---

## Implementation Plan

### Phase 1: Backend — Add tRPC infrastructure

1. **Install dependencies**
   ```
   npm install nestjs-trpc @trpc/server zod --workspace=apps/backend
   ```

2. **Create tRPC context class** (`src/trpc/trpc.context.ts`)
   - Implements `TRPCContext` from `nestjs-trpc`
   - Extracts user from request (reuses `MockAuthGuard` logic or reads from headers)
   - Provides `{ userId, userEmail }` to all procedures

3. **Create auth middleware** (`src/trpc/trpc-auth.middleware.ts`)
   - Implements `TRPCMiddleware`
   - Replicates `MockAuthGuard` behavior: upserts mock user, attaches to context
   - Applied globally via `TRPCModule.forRoot({ globalMiddlewares: [...] })`

4. **Register `TRPCModule` in `AppModule`** (`src/app.module.ts`)
   ```typescript
   TRPCModule.forRoot({
     basePath: '/trpc',
     context: TrpcContext,
     globalMiddlewares: [TrpcAuthMiddleware],
   })
   ```
   - Existing REST controllers remain untouched
   - tRPC routes served under `/trpc/*` alongside `/books`, `/child-profiles`, etc.

5. **Create tRPC routers** (one per existing module, mapping 1:1 to services):

   | Router file | Alias | Maps to | Key procedures |
   |-------------|-------|---------|----------------|
   | `src/trpc/routers/book.router.ts` | `books` | `BookService` | `list`, `getById`, `generate`, `preview`, `editPage`, `regenerate`, `approve`, `getPdf` |
   | `src/trpc/routers/child-profile.router.ts` | `childProfiles` | `ChildProfileService` | `list`, `getById`, `create`, `update`, `delete` |
   | `src/trpc/routers/story-library.router.ts` | `stories` | `StoryLibraryService` | `search` |
   | `src/trpc/routers/settings.router.ts` | `settings` | `SettingsService` | `getGeneration`, `updateGeneration` |
   | `src/trpc/routers/app.router.ts` | — | — | Merges all sub-routers into `appRouter` |

6. **Define Zod schemas** for input validation in each router (e.g., `bookIdSchema`, `paginationSchema`, `generateBookInputSchema`)

7. **Wire routers into modules** — register each `*Router` class as a provider in its corresponding NestJS module so DI works

### Phase 2: Frontend — Add tRPC client

1. **Install dependencies**
   ```
   npm install @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod --workspace=apps/frontend
   ```

2. **Create tRPC client utility** (`src/lib/trpc.ts`)
   - Uses `createTRPCOptionsProxy` from `@trpc/tanstack-react-query`
   - Configures `httpBatchLink` pointing to `/api/trpc` (goes through existing Next.js rewrite proxy)
   - Exports typed `useTRPC()` hook and `trpc` proxy for server-side prefetching

3. **Add `QueryClientProvider`** to root layout (`src/app/layout.tsx`)
   - Wraps the existing `ThemeProvider` > `AuthProvider` tree
   - Provides React Query context to all client components

4. **Migrate pages incrementally** — replace `fetch` + `useState` with tRPC hooks:

   | Page | Current pattern | tRPC replacement |
   |------|-----------------|------------------|
   | Dashboard (`page.tsx`) | `fetch('/api/books?...')` + `useState` + `AbortController` | `trpc.books.list.queryOptions({...})` + `useQuery()` |
   | Book detail (`[id]/page.tsx`) | `fetch('/api/books/:id')` | `trpc.books.getById.queryOptions({id})` |
   | Generating (`[id]/generating/page.tsx`) | `setInterval` polling | `trpc.books.getById.queryOptions({id}, {refetchInterval: 2000})` |
   | Preview (`[id]/preview/page.tsx`) | `fetch` + approve/regenerate mutations | `useMutation(trpc.books.approve.mutationOptions())` |
   | Profiles (`profiles/page.tsx`) | CRUD via `fetch` | `trpc.childProfiles.list/queryOptions()`, `useMutation` for create/update/delete |
   | StoryStep | Debounced `fetch` | `trpc.stories.search.queryOptions({search, limit, offset})` with React Query's built-in debouncing |

5. **Remove old fetch patterns** — delete `normalizeProfiles()` helper, manual loading/error state, `AbortController` refs

### Phase 3: Cleanup

1. **Keep REST controllers** for backward compatibility (or mark as deprecated)
2. **Update `next.config.mjs`** — add `/api/trpc` to the rewrite proxy (may already work since `/api/:path*` catches it)
3. **Update tests** — adapt Vitest specs to mock tRPC procedures instead of `fetch`
4. **Update AGENTS-backend.md and AGENTS-frontend.md** to document the new tRPC layer

---

## Migration Strategy

**Incremental, not big-bang.** Start with one domain:

1. Add tRPC infrastructure (context, middleware, module registration)
2. Create `childProfiles` router (simplest CRUD, no queue/async logic)
3. Migrate the Profiles page on the frontend
4. Verify end-to-end, then proceed to `books`, `stories`, `settings`

REST controllers stay active throughout — no breaking changes.

---

## Key Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Which approach? | A: `nestjs-trpc` / B: standalone | **A** — natural NestJS fit |
| Migrate all at once or incrementally? | All / one router at a time | **Incremental** — lower risk |
| Keep REST controllers? | Yes (parallel) / Remove after migration | **Keep** — backward compat, less risk |
| Add React Query separately? | Yes / rely on tRPC's built-in integration | **tRPC's integration** — `@trpc/tanstack-react-query` bundles it |

---

## Risks

- **`nestjs-trpc` maturity** — smaller community than core tRPC. If it becomes unmaintained, the routers would need to be extracted to standalone tRPC.
- **Two API surfaces** — REST and tRPC coexist, which can confuse contributors. Document clearly in AGENTS files.
- **Zod dependency** — adds a new runtime dependency to both backend and frontend for input validation schemas.
