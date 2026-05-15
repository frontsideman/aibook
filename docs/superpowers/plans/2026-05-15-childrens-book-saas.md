# Children's Book SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SAAS for AI-generated children's books with persistent child profiles, multi-page A3 support, and a hybrid generation/review workflow.

**Architecture:** Monorepo with NestJS backend, Next.js frontend, and a shared Prisma database. Uses BullMQ for asynchronous processing and MSW for testing.

**Tech Stack:** NestJS, Next.js, Prisma, PostgreSQL, Redis, BullMQ, PDFKit, Stripe/Paddle, MSW, Jest.

---

### Task 1: Monorepo & Base Config

**Files:**
- Create: `package.json`, `turbo.json`, `apps/backend/package.json`, `apps/frontend/package.json`, `packages/database/package.json`, `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Initialize Monorepo**
```json
{
  "name": "ai-book-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

- [ ] **Step 2: Setup Prisma Schema**
```prisma
model User {
  id               String         @id @default(cuid())
  email            String         @unique
  subscriptionActive Boolean      @default(false)
  childProfiles    ChildProfile[]
  books            Book[]
}

model ChildProfile {
  id        String   @id @default(cuid())
  name      String
  age       Int
  gender    String
  interests String[]
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  books     Book[]
}

model Book {
  id        String   @id @default(cuid())
  title     String
  status    String   // DRAFT, GENERATING, REVIEW, COMPLETED
  type      String   // AI_ADAPTED, MANUAL
  style     String   // MANGA, COMIC, RAINBOW
  pages     Page[]
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id])
}

model Page {
  id             String         @id @default(cuid())
  pageNumber     Int
  textContent    String
  illustrations  Illustration[]
  bookId         String
  book           Book           @relation(fields: [bookId], references: [id])
}

model Illustration {
  id      String @id @default(cuid())
  url     String
  prompt  String
  pageId  String
  page    Page   @relation(fields: [pageId], references: [id])
}
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "chore: initial monorepo and prisma schema setup"
```

---

### Task 2: Child Profile Management

**Files:**
- Create: `apps/backend/src/child-profile/child-profile.service.ts`, `apps/backend/src/child-profile/child-profile.controller.ts`
- Create: `apps/frontend/src/app/profiles/page.tsx`

- [ ] **Step 1: Write NestJS Service for Profiles**
```typescript
@Injectable()
export class ChildProfileService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, data: CreateProfileDto) {
    return this.prisma.childProfile.create({ data: { ...data, userId } });
  }
}
```

- [ ] **Step 2: Implement "Mandatory Profile" Guard in Frontend**
```typescript
// frontend/middleware.ts logic
if (isCreationPath && !userHasProfiles) {
  return NextResponse.redirect('/profiles/new');
}
```

- [ ] **Step 3: Test Profile Creation**
Run: `npm run test backend/child-profile`
Expected: PASS

---

### Task 3: AI Service & Mocking (MSW)

**Files:**
- Create: `apps/backend/src/ai/ai.service.ts`, `apps/backend/src/ai/mock-ai.service.ts`
- Create: `apps/frontend/src/mocks/handlers.ts`

- [ ] **Step 1: Setup MSW for API Mocking**
```typescript
import { http, HttpResponse } from 'msw'
export const handlers = [
  http.get('/api/books', () => {
    return HttpResponse.json([{ id: '1', title: 'Mock Book' }])
  })
]
```

- [ ] **Step 2: Implement Mock AI Strategy**
```typescript
export class MockAiService implements AiProvider {
  async generateStory() { return "Once upon a time in a mock world..." }
  async generateImage() { return "https://placehold.co/600x400?text=Illustration" }
}
```

---

### Task 4: BullMQ Generation Engine

**Files:**
- Create: `apps/backend/src/jobs/book.processor.ts`

- [ ] **Step 1: Implement Main Generator Loop**
```typescript
@Processor('book-generation')
export class BookProcessor {
  async process(job: Job) {
    // 1. Generate text
    // 2. Generate prompts based on style (Manga/Comic logic)
    // 3. Trigger image generation
    // 4. Update DB status to REVIEW
  }
}
```

- [ ] **Step 2: Add Manga Prompting Logic**
```typescript
const getMangaPrompt = (context: string) => `Black and white manga style, screentones, dramatic angles: ${context}`;
```

---

### Task 5: PDF Assembly (A3 Format)

**Files:**
- Create: `apps/backend/src/pdf/pdf.service.ts`

- [ ] **Step 1: Implement PDFKit Generator**
```typescript
import PDFDocument from 'pdfkit';
const doc = new PDFDocument({ size: 'A3', layout: 'landscape' });
doc.image(imgPath, 0, 0, { width: 1190 }); // A3 Landscape width
```

---

### Task 6: Gallery & Search

**Files:**
- Create: `apps/backend/src/book/book.controller.ts`

- [ ] **Step 1: Implement Paginated Search**
```typescript
async findAll(query: SearchQueryDto) {
  return this.prisma.book.findMany({
    where: { title: { contains: query.search } },
    skip: (query.page - 1) * 10,
    take: 10,
  });
}
```
