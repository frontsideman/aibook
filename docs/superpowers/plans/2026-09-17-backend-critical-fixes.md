# Backend Critical Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить Backend Critical из ревью: IDOR, user-scoping, статусные коды, ValidationPipe, атомарность regenerate, идемпотентность процессора.

**Architecture:** Скоупить все Prisma-запросы по `userId` из сессии, перевести статусные ошибки на 409, включить глобальный ValidationPipe с class-validator DTO, убрать delete из сервиса в транзакцию процессора, сделать процессор идемпотентным через guard статуса + `UnrecoverableError` + `jobId`.

**Tech Stack:** NestJS 10, Prisma 7 (@repo/database), BullMQ 5, class-validator + class-transformer, Jest.

---

### Task 1: ChildProfile user-scoping (IDOR)

**Files:**
- Modify: `apps/backend/src/child-profile/child-profile.service.ts`
- Modify: `apps/backend/src/child-profile/child-profile.controller.ts`
- Modify: `apps/backend/src/child-profile/child-profile.service.spec.ts` (расширить; существующий create-тест сохранить)

- [ ] **Step 1: Write failing test (service spec — scoped read)**

```ts
it('returns null when the profile belongs to another user', async () => {
  (mockPrismaClient.childProfile.findFirst as jest.Mock).mockResolvedValue(null);
  const result = await service.findOne('cp1', 'user-1');
  expect(mockPrismaClient.childProfile.findFirst).toHaveBeenCalledWith({
    where: { id: 'cp1', userId: 'user-1' },
  });
  expect(result).toBeNull();
});
```

Примечание: перед этим добавить `findFirst: jest.fn()` в `mockPrismaClient.childProfile` спека.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/backend -- child-profile.service.spec`
Expected: FAIL with "service.findOne is not a function" или "findFirst not scoped" (аргумент userId отсутствует).

- [ ] **Step 3: Minimal implementation (service)**

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChildProfileService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    age: number;
    gender: string;
    interests: string[];
    userId: string;
  }) {
    return this.prisma.client.childProfile.create({ data });
  }

  async findAll(userId: string) {
    return this.prisma.client.childProfile.findMany({ where: { userId } });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.client.childProfile.findFirst({ where: { id, userId } });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{ name: string; age: number; gender: string; interests: string[] }>
  ) {
    const existing = await this.prisma.client.childProfile.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Child profile not found');
    return this.prisma.client.childProfile.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.client.childProfile.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Child profile not found');
    return this.prisma.client.childProfile.delete({ where: { id } });
  }
}
```

- [ ] **Step 4: Wire userId in controller**

```ts
@Get(':id')
findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
  return this.childProfileService.findOne(id, req.user.id);
}

@Patch(':id')
update(
  @Param('id') id: string,
  @Body() updateDto: UpdateChildProfileDto,
  @Req() req: AuthenticatedRequest
) {
  return this.childProfileService.update(id, req.user.id, updateDto);
}

@Delete(':id')
remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
  return this.childProfileService.remove(id, req.user.id);
}
```

- [ ] **Step 5: Run tests**

Run: `npm run test --workspace=apps/backend -- child-profile`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/child-profile/
git commit -m "fix(backend): scope child profiles by user"
```

---

### Task 2: Проверка владения childId при создании книги

**Files:**
- Modify: `apps/backend/src/book/book.service.ts:117-160`
- Modify: `apps/backend/src/book/book.service.spec.ts` (mock `childProfile.findFirst`, новые кейсы)

- [ ] **Step 1: Write failing test**

```ts
it('rejects a childId owned by another user', async () => {
  mockPrismaClient.childProfile.findFirst.mockResolvedValue(null);
  await expect(
    service.createAndGenerate(
      { childId: ' чужой', type: 'AI_ADAPTED', style: 'cartoon' } as never,
      'user-1'
    )
  ).rejects.toThrow(NotFoundException);
  expect(mockPrismaClient.book.create).not.toHaveBeenCalled();
});
```

Перед этим добавить в спек: `childProfile: { findFirst: jest.fn() }` в `mockPrismaClient`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/backend -- book.service.spec -t "rejects a childId"`
Expected: FAIL (книга создаётся без проверки).

- [ ] **Step 3: Minimal implementation (в начало `createAndGenerate`, после чтения user)**

```ts
const child = await this.prisma.client.childProfile.findFirst({
  where: { id: dto.childId, userId },
  select: { id: true },
});
if (!child) throw new NotFoundException('Child profile not found');
```

- [ ] **Step 4: Run tests**

Run: `npm run test --workspace=apps/backend -- book.service.spec`
Expected: PASS (старые тесты дополнить `childProfile.findFirst.mockResolvedValue({ id: 'c1' })` в `beforeEach`).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/book/book.service.ts apps/backend/src/book/book.service.spec.ts
git commit -m "fix(backend): verify child ownership on book create"
```

---

### Task 3: Обязательный userId, коды 409, approve без TOCTOU, findAll без cross-user side-effect, лимит editPage

**Files:**
- Modify: `apps/backend/src/book/book.service.ts:81-115,162-283`
- Modify: `apps/backend/src/book/book.service.spec.ts`

- [ ] **Step 1: Write failing tests**

```ts
it('throws Conflict when previewing a GENERATING book', async () => {
  mockPrismaClient.book.findUnique.mockResolvedValue({ id: 'b1', status: BookStatus.GENERATING });
  await expect(service.getPreview('b1', 'user-1')).rejects.toThrow(ConflictException);
});

it('throws Conflict when approving a non-REVIEW book', async () => {
  mockPrismaClient.book.findUnique.mockResolvedValue({ id: 'b1', status: BookStatus.GENERATING, userId: 'user-1' });
  mockPrismaClient.book.updateMany.mockResolvedValue({ count: 0 });
  await expect(service.approveBook('b1', 'user-1')).rejects.toThrow(ConflictException);
});

it('rejects overlong parent edits', async () => {
  mockPrismaClient.page.findUnique.mockResolvedValue({ id: 'p1', textContent: 'x' });
  mockPrismaClient.book.findUnique.mockResolvedValue({ id: 'b1' });
  await expect(service.editPage('b1', 1, { feedback: 'y'.repeat(2001) }, 'user-1')).rejects.toThrow(BadRequestException);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=apps/backend -- book.service.spec`
Expected: FAIL (сейчас 404 / нет лимита).

- [ ] **Step 3: Minimal implementation**

```ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

const MAX_PARENT_EDIT_LENGTH = 2000;
```

`findAll`: извлечь `userId` из `where` и скоупить stale-перевод:

```ts
const scopeUserId = (where as { userId?: unknown } | undefined)?.userId;
await this.prisma.client.book.updateMany({
  where: {
    status: BookStatus.GENERATING,
    updatedAt: { lt: staleGenerationCutoff },
    ...(typeof scopeUserId === 'string' ? { userId: scopeUserId } : {}),
  },
  data: { status: BookStatus.FAILED },
});
```

Плюс детерминированный первый page-preview:

```ts
pages: { take: 1, orderBy: { pageNumber: 'asc' }, include: { illustrations: { take: 1 } } },
```

Сигнатуры: `userId?: string` → `userId: string` в `getById`, `getPreview`, `approveBook`, `editPage`, `regenerate`, `getPdfUrl`; `where: { id: bookId, userId }` везде без spread.

`getPreview`: заменить второй 404 на `throw new ConflictException('Book is still being generated')`.

`approveBook` (атомарно, без TOCTOU):

```ts
async approveBook(bookId: string, userId: string) {
  const updated = await this.prisma.client.book.updateMany({
    where: { id: bookId, userId, status: BookStatus.REVIEW },
    data: { status: BookStatus.COMPLETED, approvedAt: new Date() },
  });
  if (updated.count === 0) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId, userId },
    });
    if (!book) throw new NotFoundException('Book not found');
    throw new ConflictException('Book must be in REVIEW status to approve');
  }
  return { status: BookStatus.COMPLETED };
}
```

Примечание: `findUnique({ where: { id, userId } })` требует, чтобы комбинация была уникальной — Prisma отклонит на этапе типов/рантайма, если нет compound unique. Если тип не соберётся, использовать `findFirst({ where: { id: bookId, userId } })` для read-веток (`getById`, `getPreview`, `approveBook`-fallback, `regenerate`, `getPdfUrl`). Предпочтительно `findFirst` везде для скоупленных чтений.

`editPage`: после ownership-check добавить:

```ts
if (dto.feedback && dto.feedback.length > MAX_PARENT_EDIT_LENGTH) {
  throw new BadRequestException('Parent feedback is too long');
}
```

Удалить мёртвый `triggerGeneration` (нет роута, нет authz).

- [ ] **Step 4: Update affected specs**

`book.service.spec.ts`: `approveBook`-тест ждёт `updateMany` + fallback `findUnique`; `findAll`-тест ждёт `userId` в stale-`updateMany` (передавать `where: { userId: 'user-1' }`); моки `updateMany`, `findFirst` по необходимости.

- [ ] **Step 5: Run tests**

Run: `npm run test --workspace=apps/backend -- book.service.spec`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/book/book.service.ts apps/backend/src/book/book.service.spec.ts
git commit -m "fix(backend): mandatory user scoping and status codes"
```

---

### Task 4: ValidationPipe + DTO-декораторы (убирает Prisma 500 вместо 400)

**Files:**
- Modify: `apps/backend/package.json` (deps)
- Modify: `apps/backend/src/main.ts`
- Modify: `apps/backend/src/book/book.service.ts:15-43` (DTO-классы)
- Modify: `apps/backend/src/book/book.controller.ts:14` (value-import DTO)
- Modify: `apps/backend/src/child-profile/child-profile.controller.ts` (DTO-классы с декораторами)

- [ ] **Step 1: Add deps**

Run: `npm install class-validator class-transformer --workspace=apps/backend`
Expected: `package.json` + lock обновлены.

- [ ] **Step 2: Write failing test (DTO validation через pipe)**

```ts
import { validate } from 'class-validator';
import { CreateBookDto } from './book.service';

it('rejects empty style', async () => {
  const dto = new CreateBookDto();
  dto.childId = 'c1';
  dto.type = 'AI_ADAPTED';
  dto.style = '';
  const errors = await validate(dto);
  expect(errors.length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test --workspace=apps/backend -- book.service.spec`
Expected: FAIL (0 ошибок без декораторов).

- [ ] **Step 4: Minimal implementation**

`main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
```

`book.service.ts` DTO:

```ts
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  childId!: string;

  @IsIn(['AI_ADAPTED', 'MANUAL'])
  type!: 'AI_ADAPTED' | 'MANUAL';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  storyTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  userContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  parentComments?: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsString()
  @IsNotEmpty()
  style!: string;
}

export class SearchQueryDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() style?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() childId?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() childName?: string;
  @IsOptional() @IsString() page?: string | number;
  @IsOptional() @IsString() limit?: string | number;
}

export class PageEditDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

export class RegenerateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  parentFeedback!: string;
}
```

`book.controller.ts`: заменить `import type { CreateBookDto, ... }` на value-import:

```ts
import { BookService, CreateBookDto, SearchQueryDto, PageEditDto, RegenerateDto } from './book.service';
```

`child-profile.controller.ts`: интерфейсы → классы:

```ts
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

class CreateChildProfileDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsInt() @Min(0) @Max(18) age!: number;
  @IsString() @IsNotEmpty() gender!: string;
  @IsOptional() @IsArray() interests?: string[];
}

class UpdateChildProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(0) @Max(18) age?: number;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsArray() interests?: string[];
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npm run test --workspace=apps/backend -- book.service.spec` → PASS; `npm run typecheck --workspace=apps/backend` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/package.json apps/backend/src/main.ts apps/backend/src/book/ apps/backend/src/child-profile/ package-lock.json
git commit -m "fix(backend): add request validation pipe and DTOs"
```

---

### Task 5: Атомарный regenerate + идемпотентный процессор

**Files:**
- Modify: `apps/backend/src/book/book.service.ts:250-274`
- Modify: `apps/backend/src/book-generation/book.processor.ts`
- Modify: `apps/backend/src/book/book.service.spec.ts`, `apps/backend/src/book-generation/book.processor.spec.ts`

- [ ] **Step 1: Write failing tests**

Service:

```ts
it('does not delete pages in the service during regenerate', async () => {
  mockPrismaClient.book.findFirst.mockResolvedValue({ id: 'b1', userId: 'user-1' });
  await service.regenerate('b1', { parentFeedback: 'Make it funnier' }, 'user-1');
  expect(mockPrismaClient.page.deleteMany).not.toHaveBeenCalled();
  expect(mockQueue.add).toHaveBeenCalledWith(
    'generate-book',
    { bookId: 'b1', parentFeedback: 'Make it funnier' },
    expect.objectContaining({ jobId: expect.stringContaining('b1') })
  );
});
```

Processor:

```ts
it('skips already reviewed books without retry', async () => {
  mockPrismaClient.book.findUnique.mockResolvedValue({ id: 'b1', status: BookStatus.REVIEW });
  await expect(processor.process({ data: { bookId: 'b1' } } as Job)).rejects.toThrow();
  expect(mockAiService.generateStory).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=apps/backend -- "book.service.spec|book.processor.spec"`
Expected: FAIL (deleteMany вызывается в сервисе; процессор перетирает REVIEW).

- [ ] **Step 3: Minimal implementation (service regenerate)**

```ts
async regenerate(bookId: string, dto: RegenerateDto, userId: string) {
  const book = await this.prisma.client.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });
  if (!book) throw new NotFoundException('Book not found');

  await this.ensureGenerationQueueReady();

  await this.prisma.client.book.update({
    where: { id: bookId },
    data: { status: BookStatus.GENERATING, parentFeedback: dto.parentFeedback },
  });

  try {
    await this.bookQueue.add(
      'generate-book',
      { bookId, parentFeedback: dto.parentFeedback },
      { jobId: `generate-${bookId}` }
    );
  } catch {
    await this.prisma.client.book.update({
      where: { id: bookId },
      data: { status: BookStatus.FAILED },
    });
    throw new ServiceUnavailableException('Book generation queue is unavailable');
  }

  return { bookId, status: 'REGENERATING' };
}
```

`createAndGenerate`: добавить `{ jobId: `generate-${book.id}` }` третьим аргументом `queue.add`; старые спеки обновить (ожидать 3-й аргумент через `expect.objectContaining`).

- [ ] **Step 4: Minimal implementation (processor)**

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UnrecoverableError, type Job } from 'bullmq';
```

В начале `process` после `findUnique`:

```ts
if (!book) {
  throw new UnrecoverableError(`Book with id ${bookId} not found`);
}
if (book.status !== BookStatus.GENERATING) {
  throw new UnrecoverableError(`Book ${bookId} is not GENERATING (status=${book.status})`);
}
```

Parse-failure: `throw new UnrecoverableError('Failed to parse story into pages...')`.

Транзакция: первым шагом `await tx.page.deleteMany({ where: { bookId: book.id } })`, затем create страниц, затем REVIEW. Мок `$transaction` в спеке отдаёт `{ page: { create, deleteMany }, book: { update } }` — обновить существующие тесты.

Catch: помечать FAILED только для retryable-ошибок; `UnrecoverableError` из транзакции не должен перетирать чужой REVIEW — guard статуса выше уже отсекает, catch оставить как есть для AI-failure.

- [ ] **Step 5: Run tests**

Run: `npm run test --workspace=apps/backend -- "book.service.spec|book.processor.spec"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/book/ apps/backend/src/book-generation/
git commit -m "fix(backend): atomic regenerate and idempotent processor"
```

---

### Task 6: Верификация и sync доков

**Files:**
- Modify: `docs/AGENTS-backend.md` (статусные коды 409, ValidationPipe, jobId, delete-в-процессоре)

- [ ] **Step 1: Full verification**

Run: `npm run lint --workspace=apps/backend` → 0 errors; `npm run typecheck --workspace=apps/backend` → exit 0; `npm run test --workspace=apps/backend` → 0 failures, pristine output.

- [ ] **Step 2: Update `docs/AGENTS-backend.md`** — зафиксировать: глобальный ValidationPipe, 409 на статусных переходах, обязательный user-scoping, `jobId=generate-<bookId>`, delete страниц только в процессоре.

- [ ] **Step 3: Commit**

```bash
git add docs/AGENTS-backend.md
git commit -m "docs(backend): sync validation and generation contracts"
```
