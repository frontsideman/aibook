# Book Creation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full text-only book creation flow from child profile selection through generating, preview, approval, and dashboard visibility, with global generation settings stored in `Settings`.

**Architecture:** Extend Prisma and backend services to store user generation defaults and per-book generation snapshots, add a dedicated owner-scoped book status endpoint, and simplify approval to text-only completion. On the frontend, redirect book creation into a dedicated generating route with polling, move model controls into global settings, and route dashboard/detail/preview flows by book status.

**Tech Stack:** Prisma 7, NestJS, BullMQ, Next.js 16, React 19, Vitest, Jest, MSW

---

## File Structure

### Backend and schema

- Modify: `packages/database/prisma/schema.prisma`
  - Add `FAILED` to `BookStatus`.
  - Add generation defaults to `User`.
  - Add generation snapshot fields to `Book`.
  - Optionally add a `ReasoningEffort` enum if string fields would be too loose.
- Modify: `packages/database/index.ts`
  - Regenerate client usage may require export surface updates if enums change.
- Modify: `apps/backend/src/book/book.controller.ts`
  - Add `GET /books/:id`.
- Modify: `apps/backend/src/book/book.service.ts`
  - Load user generation defaults during creation.
  - Add owner-scoped detail/status fetcher.
  - Remove PDF generation from approval.
- Modify: `apps/backend/src/book-generation/book.processor.ts`
  - Mark `GENERATING`, generate text only, mark `REVIEW` or `FAILED`.
- Create: `apps/backend/src/settings/settings.controller.ts`
  - Expose `GET /settings/generation` and `PATCH /settings/generation`.
- Create: `apps/backend/src/settings/settings.service.ts`
  - Read/write user generation defaults.
- Create: `apps/backend/src/settings/settings.module.ts`
  - Wire controller and service.
- Modify: `apps/backend/src/app.module.ts`
  - Register settings module if needed.

### Backend tests

- Modify: `apps/backend/src/book/book.controller.spec.ts`
  - Cover `GET /books/:id`.
- Modify: `apps/backend/src/book/book.service.spec.ts`
  - Cover settings-backed creation and text-only approval.
- Modify: `apps/backend/src/book-generation/book.processor.spec.ts`
  - Remove illustration expectations.
  - Add `GENERATING` and `FAILED` assertions.
- Create: `apps/backend/src/settings/settings.controller.spec.ts`
  - Cover get/update generation settings.

### Frontend routes and components

- Modify: `apps/frontend/src/app/(app)/books/new/CreateBookPage.tsx`
  - Load profiles and settings state.
- Modify: `apps/frontend/src/components/books/CreateBookForm.tsx`
  - Redirect to `/books/:id/generating`.
  - Show no-profile/settings-fallback UX.
- Create: `apps/frontend/src/app/(app)/books/[id]/generating/page.tsx`
  - Poll book status and redirect by status.
- Modify: `apps/frontend/src/app/(app)/books/[id]/preview/page.tsx`
  - Guard non-`REVIEW` statuses.
- Modify: `apps/frontend/src/app/(app)/books/[id]/page.tsx`
  - Use `GET /api/books/:id` instead of preview endpoint.
- Modify: `apps/frontend/src/app/(app)/settings/page.tsx`
  - Replace placeholder with generation settings form.
- Modify: `apps/frontend/src/components/BookCard.tsx`
  - Route by status.
- Modify: `apps/frontend/src/lib/books-view-model.ts`
  - Add `FAILED`.
- Modify: `apps/frontend/src/mocks/handlers.ts`
  - Add settings endpoint and book detail/status endpoint mocks.

### Frontend tests

- Modify: `apps/frontend/src/app/(app)/books/new/page.spec.tsx`
  - Expect generating redirect.
- Create: `apps/frontend/src/app/(app)/books/[id]/generating/page.spec.tsx`
  - Cover polling, redirect, and failed state.
- Modify: `apps/frontend/src/app/(app)/books/[id]/preview/page.spec.tsx`
  - Cover guard/redirect behavior.
- Modify: `apps/frontend/src/app/(app)/books/[id]/page.spec.tsx`
  - Cover detail endpoint usage.
- Create: `apps/frontend/src/app/(app)/settings/page.spec.tsx`
  - Cover load/save generation settings.
- Modify: `apps/frontend/src/lib/books-view-model.spec.ts`
  - Cover `FAILED`.

## Task 1: Extend Prisma Models For Generation Settings and Statuses

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Modify: `packages/database/index.ts`
- Test: `apps/backend/src/book/book.service.spec.ts`

- [ ] **Step 1: Write the failing backend test for settings-backed creation**

```ts
it('stores the user generation defaults on a newly created book', async () => {
  mockPrismaClient.user.findUnique.mockResolvedValue({
    id: 'user-1',
    preferredLlmModel: 'openai:gpt-5.4-mini',
    preferredReasoningEffort: 'MEDIUM',
  });

  mockPrismaClient.book.create.mockResolvedValue({ id: 'book-1' });
  mockQueue.add.mockResolvedValue(undefined);

  await service.createAndGenerate(
    { childId: 'child-1', type: 'AI_ADAPTED', storyTitle: 'Cinderella', style: 'WATERCOLOR' } as any,
    'user-1',
  );

  expect(mockPrismaClient.book.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        llmModel: 'openai:gpt-5.4-mini',
        reasoningEffort: 'MEDIUM',
      }),
    }),
  );
});
```

- [ ] **Step 2: Run the targeted backend test to confirm it fails**

Run: `npm --workspace apps/backend test -- book.service.spec.ts`

Expected: FAIL with Prisma/service shape errors such as missing `preferredLlmModel`, `preferredReasoningEffort`, `llmModel`, or `reasoningEffort`.

- [ ] **Step 3: Update Prisma schema and regenerate the client**

```prisma
enum BookStatus {
  DRAFT
  GENERATING
  REVIEW
  COMPLETED
  FAILED
}

enum ReasoningEffort {
  LOW
  MEDIUM
  HIGH
}

model User {
  id                       String           @id @default(cuid())
  email                    String           @unique
  subscriptionActive       Boolean          @default(false)
  preferredLlmModel        String           @default("openai:gpt-5.4-mini")
  preferredReasoningEffort ReasoningEffort  @default(MEDIUM)
  childProfiles            ChildProfile[]
  books                    Book[]
  createdAt                DateTime         @default(now())
  updatedAt                DateTime         @updatedAt
}

model Book {
  id               String           @id @default(cuid())
  title            String
  status           BookStatus       @default(DRAFT)
  type             BookType         @default(AI_ADAPTED)
  style            BookStyle
  llmModel         String
  reasoningEffort  ReasoningEffort
  tone             Tone?
  parentComments   String?
  parentFeedback   Json?
  pdfUrl           String?
  approvedAt       DateTime?
  pages            Page[]
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId           String
  child            ChildProfile     @relation(fields: [childId], references: [id], onDelete: Cascade)
  childId          String
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}
```

Run: `npm --workspace packages/database run generate`

- [ ] **Step 4: Re-run the targeted test to verify the schema shape is now available**

Run: `npm --workspace apps/backend test -- book.service.spec.ts`

Expected: still FAIL, but now on service logic rather than missing schema fields.

- [ ] **Step 5: Commit the schema groundwork**

```bash
git add packages/database/prisma/schema.prisma packages/database
git commit -m "feat(database): add book generation settings fields"
```

## Task 2: Implement Backend Settings and Book Status Contract

**Files:**
- Create: `apps/backend/src/settings/settings.controller.ts`
- Create: `apps/backend/src/settings/settings.service.ts`
- Create: `apps/backend/src/settings/settings.module.ts`
- Modify: `apps/backend/src/app.module.ts`
- Modify: `apps/backend/src/book/book.controller.ts`
- Modify: `apps/backend/src/book/book.service.ts`
- Modify: `apps/backend/src/book/book.controller.spec.ts`
- Modify: `apps/backend/src/book/book.service.spec.ts`
- Create: `apps/backend/src/settings/settings.controller.spec.ts`

- [ ] **Step 1: Add failing tests for settings endpoints and owner-scoped book detail**

```ts
it('returns owner-scoped generation settings', async () => {
  mockSettingsService.getGenerationSettings.mockResolvedValue({
    llmModel: 'openai:gpt-5.4-mini',
    reasoningEffort: 'MEDIUM',
  });

  await controller.getGenerationSettings({ user: { id: 'user-1' } });

  expect(mockSettingsService.getGenerationSettings).toHaveBeenCalledWith('user-1');
});

it('returns owner-scoped book detail', async () => {
  mockBookService.getById.mockResolvedValue({ id: 'book-1', status: 'GENERATING' });

  await controller.findOne('book-1', { user: { id: 'user-1' } });

  expect(mockBookService.getById).toHaveBeenCalledWith('book-1', 'user-1');
});

it('approves a review book without calling pdf generation', async () => {
  mockPrismaClient.book.findUnique.mockResolvedValue({
    id: 'book-1',
    status: BookStatus.REVIEW,
  });

  await service.approveBook('book-1', 'user-1');

  expect(mockPdfService.generateBookPdf).not.toHaveBeenCalled();
  expect(mockStorageService.upload).not.toHaveBeenCalled();
  expect(mockPrismaClient.book.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: BookStatus.COMPLETED }),
    }),
  );
});
```

- [ ] **Step 2: Run the backend contract tests and verify failure**

Run: `npm --workspace apps/backend test -- book.controller.spec.ts settings.controller.spec.ts book.service.spec.ts`

Expected: FAIL because `SettingsController`, `SettingsService`, and `BookController.findOne()` do not exist yet.

- [ ] **Step 3: Implement settings module, `GET /books/:id`, and settings-backed creation**

```ts
// apps/backend/src/settings/settings.service.ts
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGenerationSettings(userId: string) {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        preferredLlmModel: true,
        preferredReasoningEffort: true,
      },
    });

    return {
      llmModel: user.preferredLlmModel,
      reasoningEffort: user.preferredReasoningEffort,
    };
  }

  async updateGenerationSettings(
    userId: string,
    input: { llmModel: string; reasoningEffort: ReasoningEffort },
  ) {
    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        preferredLlmModel: input.llmModel,
        preferredReasoningEffort: input.reasoningEffort,
      },
      select: {
        preferredLlmModel: true,
        preferredReasoningEffort: true,
      },
    });

    return {
      llmModel: user.preferredLlmModel,
      reasoningEffort: user.preferredReasoningEffort,
    };
  }
}

// apps/backend/src/book/book.controller.ts
@Get(':id')
async findOne(@Param('id') id: string, @Req() req: any) {
  return this.bookService.getById(id, req.user.id);
}

// apps/backend/src/book/book.service.ts
async getById(bookId: string, userId?: string) {
  const book = await this.prisma.client.book.findUnique({
    where: { id: bookId, ...(userId ? { userId } : {}) },
    include: {
      child: { select: { id: true, name: true, age: true } },
      pages: { orderBy: { pageNumber: 'asc' } },
    },
  });

  if (!book) throw new NotFoundException('Book not found');
  return book;
}
```

- [ ] **Step 4: Re-run the backend contract tests**

Run: `npm --workspace apps/backend test -- book.controller.spec.ts settings.controller.spec.ts book.service.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the backend contract slice**

```bash
git add apps/backend/src/app.module.ts apps/backend/src/book apps/backend/src/settings
git commit -m "feat(backend): add generation settings and book status endpoints"
```

## Task 3: Make The Worker Text-Only and Failure-Aware

**Files:**
- Modify: `apps/backend/src/book-generation/book.processor.ts`
- Modify: `apps/backend/src/book-generation/book.processor.spec.ts`

- [ ] **Step 1: Write failing worker tests for `GENERATING`, `FAILED`, and no illustrations**

```ts
it('marks the book generating before creating pages', async () => {
  await processor.process({ data: { bookId: 'book-1' } } as Job);

  expect(prisma.client.book.update).toHaveBeenNthCalledWith(1, {
    where: { id: 'book-1' },
    data: { status: BookStatus.GENERATING },
  });
});

it('does not request illustrations during generation', async () => {
  await processor.process({ data: { bookId: 'book-1' } } as Job);
  expect(aiService.generateImage).not.toHaveBeenCalled();
  expect(prisma.client.illustration.create).not.toHaveBeenCalled();
});

it('marks the book failed when story generation throws', async () => {
  mockAiService.generateStory.mockRejectedValue(new Error('provider down'));

  await expect(processor.process({ data: { bookId: 'book-1' } } as Job)).rejects.toThrow('provider down');

  expect(prisma.client.book.update).toHaveBeenCalledWith({
    where: { id: 'book-1' },
    data: { status: BookStatus.FAILED },
  });
});
```

- [ ] **Step 2: Run the worker tests and confirm they fail**

Run: `npm --workspace apps/backend test -- book.processor.spec.ts`

Expected: FAIL because the processor still creates illustrations and never writes `GENERATING` or `FAILED`.

- [ ] **Step 3: Implement text-only generation and failure status**

```ts
async process(job: Job<{ bookId: string; parentFeedback?: string }>) {
  const { bookId, parentFeedback } = job.data;

  const book = await this.prisma.client.book.findUnique({
    where: { id: bookId },
    include: { child: true },
  });

  if (!book) {
    throw new Error(`Book with id ${bookId} not found`);
  }

  await this.prisma.client.book.update({
    where: { id: book.id },
    data: { status: BookStatus.GENERATING },
  });

  try {
    const storyText = await this.aiService.generateStory(storyPrompt);
    const pagesContent = storyText
      .split(/Page \d+:/)
      .map((content) => content.trim())
      .filter(Boolean);

    for (let i = 0; i < pagesContent.length; i += 1) {
      await this.prisma.client.page.create({
        data: {
          bookId: book.id,
          pageNumber: i + 1,
          textContent: pagesContent[i],
        },
      });
    }

    await this.prisma.client.book.update({
      where: { id: book.id },
      data: { status: BookStatus.REVIEW },
    });
  } catch (error) {
    await this.prisma.client.book.update({
      where: { id: book.id },
      data: { status: BookStatus.FAILED },
    });
    throw error;
  }
}
```

- [ ] **Step 4: Re-run the worker tests**

Run: `npm --workspace apps/backend test -- book.processor.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the worker slice**

```bash
git add apps/backend/src/book-generation/book.processor.ts apps/backend/src/book-generation/book.processor.spec.ts
git commit -m "feat(backend): add text-only book generation states"
```

## Task 4: Redirect Book Creation Into The Generating Page

**Files:**
- Modify: `apps/frontend/src/app/(app)/books/new/CreateBookPage.tsx`
- Modify: `apps/frontend/src/components/books/CreateBookForm.tsx`
- Modify: `apps/frontend/src/app/(app)/books/new/page.spec.tsx`
- Modify: `apps/frontend/src/mocks/handlers.ts`

- [ ] **Step 1: Update the frontend test to expect generating flow and settings loading**

```tsx
it('redirects to the generating page after creating a book', async () => {
  global.fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'p1', name: 'Nina', age: 7 }],
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ llmModel: 'openai:gpt-5.4-mini', reasoningEffort: 'MEDIUM' }),
    } as Response)
    .mockResolvedValue({
      ok: true,
      json: async () => ({ bookId: 'b1' }),
    } as Response);

  render(<CreateBookPage />);

  await screen.findByText('Nina');
  fireEvent.click(screen.getByRole('button', { name: 'Select' }));
  fireEvent.change(screen.getByLabelText('Story'), { target: { value: 'Little Red Riding Hood' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Book' }));

  await waitFor(() => {
    expect(push).toHaveBeenCalledWith('/books/b1/generating');
  });
});
```

- [ ] **Step 2: Run the create-book test and confirm failure**

Run: `npm --workspace apps/frontend test -- apps/frontend/src/app/'(app)'/books/new/page.spec.tsx`

Expected: FAIL because the page still redirects to preview and does not load settings.

- [ ] **Step 3: Implement settings fetch, fallback warning, and generating redirect**

```tsx
// apps/frontend/src/app/(app)/books/new/CreateBookPage.tsx
const [settingsWarning, setSettingsWarning] = useState('');

useEffect(() => {
  fetch('/api/settings/generation')
    .then((response) => {
      if (!response.ok) {
        throw new Error('settings unavailable');
      }
      return response.json();
    })
    .catch(() => {
      setSettingsWarning('Using default generation settings: OpenAI GPT-5.4 mini, reasoning medium.');
    });
}, []);

// apps/frontend/src/components/books/CreateBookForm.tsx
const { bookId } = (await response.json()) as { bookId: string };
router.push(`/books/${bookId}/generating`);
```

- [ ] **Step 4: Re-run the create-book test**

Run: `npm --workspace apps/frontend test -- apps/frontend/src/app/'(app)'/books/new/page.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the create-to-generating slice**

```bash
git add apps/frontend/src/app/'(app)'/books/new/CreateBookPage.tsx apps/frontend/src/components/books/CreateBookForm.tsx apps/frontend/src/app/'(app)'/books/new/page.spec.tsx apps/frontend/src/mocks/handlers.ts
git commit -m "feat(frontend): redirect book creation through generating flow"
```

## Task 5: Add The Generating Route and Fix Status-Based Navigation

**Files:**
- Create: `apps/frontend/src/app/(app)/books/[id]/generating/page.tsx`
- Create: `apps/frontend/src/app/(app)/books/[id]/generating/page.spec.tsx`
- Modify: `apps/frontend/src/app/(app)/books/[id]/preview/page.tsx`
- Modify: `apps/frontend/src/app/(app)/books/[id]/page.tsx`
- Modify: `apps/frontend/src/app/(app)/books/[id]/page.spec.tsx`
- Modify: `apps/frontend/src/app/(app)/books/[id]/preview/page.spec.tsx`
- Modify: `apps/frontend/src/components/BookCard.tsx`
- Modify: `apps/frontend/src/lib/books-view-model.ts`
- Modify: `apps/frontend/src/lib/books-view-model.spec.ts`
- Modify: `apps/frontend/src/mocks/handlers.ts`

- [ ] **Step 1: Add failing tests for generating polling, failed state, and status-based links**

```tsx
it('redirects from generating to preview when the book reaches review', async () => {
  global.fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'b5', status: 'GENERATING', title: 'New Book' }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'b5', status: 'REVIEW', title: 'New Book' }),
    } as Response);

  render(<GeneratingBookPage />);

  await waitFor(() => {
    expect(replace).toHaveBeenCalledWith('/books/b5/preview');
  });
});

it('routes failed books to the generating page', () => {
  expect(toBookHref({ id: 'b4', status: 'FAILED' })).toBe('/books/b4/generating');
});
```

- [ ] **Step 2: Run the focused frontend tests and confirm failure**

Run: `npm --workspace apps/frontend test -- apps/frontend/src/app/'(app)'/books/'[id]'/generating/page.spec.tsx apps/frontend/src/app/'(app)'/books/'[id]'/page.spec.tsx apps/frontend/src/app/'(app)'/books/'[id]'/preview/page.spec.tsx apps/frontend/src/lib/books-view-model.spec.ts`

Expected: FAIL because the generating route does not exist, detail still uses preview data, and `FAILED` is unsupported.

- [ ] **Step 3: Implement generating polling route and status-based navigation helpers**

```tsx
// apps/frontend/src/app/(app)/books/[id]/generating/page.tsx
useEffect(() => {
  let cancelled = false;

  const poll = async () => {
    const response = await fetch(`/api/books/${params.id}`, { cache: 'no-store' });
    const book = await response.json();

    if (cancelled) return;
    setBook(book);

    if (book.status === 'REVIEW') {
      router.replace(`/books/${params.id}/preview`);
      return;
    }

    if (book.status === 'COMPLETED') {
      router.replace(`/books/${params.id}`);
      return;
    }

    if (book.status === 'DRAFT' || book.status === 'GENERATING') {
      timer = window.setTimeout(poll, 2000);
    }
  };

  let timer = window.setTimeout(poll, 0);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}, [params.id, router]);

// apps/frontend/src/components/BookCard.tsx
export function toBookHref(id: string, status: string) {
  if (status === 'COMPLETED') return `/books/${id}`;
  if (status === 'REVIEW') return `/books/${id}/preview`;
  return `/books/${id}/generating`;
}
```

- [ ] **Step 4: Re-run the focused frontend tests**

Run: `npm --workspace apps/frontend test -- apps/frontend/src/app/'(app)'/books/'[id]'/generating/page.spec.tsx apps/frontend/src/app/'(app)'/books/'[id]'/page.spec.tsx apps/frontend/src/app/'(app)'/books/'[id]'/preview/page.spec.tsx apps/frontend/src/lib/books-view-model.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the generating/status-navigation slice**

```bash
git add apps/frontend/src/app/'(app)'/books/'[id]'/generating apps/frontend/src/app/'(app)'/books/'[id]'/page.tsx apps/frontend/src/app/'(app)'/books/'[id]'/preview/page.tsx apps/frontend/src/components/BookCard.tsx apps/frontend/src/lib/books-view-model.ts apps/frontend/src/lib/books-view-model.spec.ts apps/frontend/src/mocks/handlers.ts
git commit -m "feat(frontend): add generating route and status-based book routing"
```

## Task 6: Build The Settings UI and Run Final Verification

**Files:**
- Modify: `apps/frontend/src/app/(app)/settings/page.tsx`
- Create: `apps/frontend/src/app/(app)/settings/page.spec.tsx`
- Modify: `apps/frontend/src/mocks/handlers.ts`

- [ ] **Step 1: Add a failing settings page test**

```tsx
it('loads and saves generation settings', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ llmModel: 'openai:gpt-5.4-mini', reasoningEffort: 'MEDIUM' }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ llmModel: 'openai:gpt-5.4-mini', reasoningEffort: 'MEDIUM' }),
    } as Response);

  global.fetch = fetchMock;

  render(<SettingsPage />);

  await screen.findByDisplayValue('OpenAI GPT-5.4 mini');
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/settings/generation',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});
```

- [ ] **Step 2: Run the settings page test and confirm failure**

Run: `npm --workspace apps/frontend test -- apps/frontend/src/app/'(app)'/settings/page.spec.tsx`

Expected: FAIL because `SettingsPage` is still placeholder content.

- [ ] **Step 3: Implement the generation settings form**

```tsx
export default function SettingsPage() {
  const [llmModel, setLlmModel] = useState('openai:gpt-5.4-mini');
  const [reasoningEffort, setReasoningEffort] = useState('MEDIUM');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/settings/generation')
      .then((response) => response.json())
      .then((data) => {
        setLlmModel(data.llmModel);
        setReasoningEffort(data.reasoningEffort);
      })
      .catch(() => setStatus('error'));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');

    const response = await fetch('/api/settings/generation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ llmModel, reasoningEffort }),
    });

    setStatus(response.ok ? 'saved' : 'error');
  };

  return (
    <form onSubmit={handleSubmit} className="paper-card p-6">
      <label className="block text-sm font-medium">Model</label>
      <select value={llmModel} onChange={(event) => setLlmModel(event.target.value)}>
        <option value="openai:gpt-5.4-mini">OpenAI GPT-5.4 mini</option>
      </select>
      <label className="block text-sm font-medium">Reasoning effort</label>
      <select value={reasoningEffort} onChange={(event) => setReasoningEffort(event.target.value)}>
        <option value="MEDIUM">Medium</option>
      </select>
      <button type="submit">Save settings</button>
    </form>
  );
}
```

- [ ] **Step 4: Run the final targeted verification suite**

Run:

```bash
npm --workspace apps/backend test -- book.controller.spec.ts book.service.spec.ts book.processor.spec.ts settings.controller.spec.ts
npm --workspace apps/frontend test -- apps/frontend/src/app/'(app)'/books/new/page.spec.tsx apps/frontend/src/app/'(app)'/books/'[id]'/generating/page.spec.tsx apps/frontend/src/app/'(app)'/books/'[id]'/page.spec.tsx apps/frontend/src/app/'(app)'/books/'[id]'/preview/page.spec.tsx apps/frontend/src/app/'(app)'/settings/page.spec.tsx apps/frontend/src/lib/books-view-model.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the settings and verification slice**

```bash
git add apps/frontend/src/app/'(app)'/settings/page.tsx apps/frontend/src/app/'(app)'/settings/page.spec.tsx apps/frontend/src/mocks/handlers.ts
git commit -m "feat(frontend): add global generation settings"
```

## Final Verification

- [ ] Run: `npm --workspace packages/database run generate`
- [ ] Run: `npm --workspace apps/backend test`
- [ ] Run: `npm --workspace apps/frontend test`
- [ ] Run: `npm --workspace apps/frontend build`
- [ ] Manually verify in the browser:
  - create a child profile,
  - create a book,
  - observe the generating page,
  - confirm automatic redirect to preview,
  - approve the book,
  - confirm the completed book appears on the dashboard.

## Self-Review

- Spec coverage check:
  - global settings: Tasks 1, 2, 4, 6
  - generating page: Tasks 4 and 5
  - preview/detail/dashboard routing: Task 5
  - text-only approval and no illustrations: Tasks 2 and 3
  - `FAILED` status: Tasks 1, 3, and 5
  - backlog design note remains in backlog/spec and does not need implementation in this plan
- Placeholder scan:
  - no `TODO`, `TBD`, or “similar to task” placeholders remain
- Type consistency:
  - plan uses `preferredLlmModel`, `preferredReasoningEffort`, `llmModel`, `reasoningEffort`, and `BookStatus.FAILED` consistently
