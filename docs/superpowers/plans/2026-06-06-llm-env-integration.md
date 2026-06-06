# LLM Env Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace backend mock story generation with a real env-configured LLM gateway while preserving the existing book-generation lifecycle and generic frontend failure behavior.

**Architecture:** Keep `BookProcessor` talking only to `AiService`, and move all outbound provider details into a dedicated `LlmGateway`. Validate required `LLM_*` environment variables during backend startup, and snapshot the active `LLM_MODEL_NAME` into each created book instead of relying on user defaults for model selection.

**Tech Stack:** NestJS, `@nestjs/config`, BullMQ, Jest, built-in `fetch`, Prisma via `@repo/database`

---

## File Structure

- Create: `apps/backend/src/ai/llm.config.ts`
  - Reads validated `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL_NAME` from `ConfigService`
- Create: `apps/backend/src/ai/llm.gateway.ts`
  - Performs outbound HTTP requests and normalizes provider responses to plain story text
- Create: `apps/backend/src/ai/llm.gateway.spec.ts`
  - Verifies request shape, success parsing, and error handling
- Modify: `apps/backend/src/ai/ai.module.ts`
  - Replace the mock provider binding with the real gateway-backed provider path
- Modify: `apps/backend/src/ai/ai.provider.interface.ts`
  - Keep or narrow the provider contract to match the real story-generation path
- Modify: `apps/backend/src/ai/ai.service.spec.ts`
  - Keep facade coverage aligned with the provider token binding
- Modify: `apps/backend/src/book/book.service.ts`
  - Snapshot `LLM_MODEL_NAME` from env config when creating books
- Modify: `apps/backend/src/book/book.service.spec.ts`
  - Assert `book.llmModel` comes from env config, not user defaults
- Modify: `apps/backend/src/book-generation/book.processor.spec.ts`
  - Verify success and failure status flow still works with the gateway-backed service
- Modify: `apps/backend/src/config/env.validation.ts`
  - Require and validate `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL_NAME`
- Modify: `apps/backend/src/config/env.validation.spec.ts`
  - Add startup validation coverage for required LLM env vars
- Modify: `apps/backend/.env.example`
  - Keep local example values aligned with validated backend config
- Delete: `apps/backend/src/ai/mock-ai.service.ts`
  - Remove runtime mock implementation once the real gateway is wired
- Delete: `apps/backend/src/ai/mock-ai.service.spec.ts`
  - Remove mock-only test coverage that no longer represents runtime behavior

### Task 1: Validate Required LLM Environment Variables

**Files:**
- Modify: `apps/backend/src/config/env.validation.ts`
- Modify: `apps/backend/src/config/env.validation.spec.ts`

- [ ] **Step 1: Write the failing env validation tests**

Add these cases to `apps/backend/src/config/env.validation.spec.ts`:

```ts
it('fails when LLM_API_URL is missing', () => {
  expect(() =>
    validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      LLM_API_KEY: 'secret',
      LLM_MODEL_NAME: 'deepseek-chat',
    }),
  ).toThrow(/LLM_API_URL is required/);
});

it('fails when LLM_API_URL is not an absolute URL', () => {
  expect(() =>
    validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      LLM_API_URL: '/v1/chat/completions',
      LLM_API_KEY: 'secret',
      LLM_MODEL_NAME: 'deepseek-chat',
    }),
  ).toThrow(/LLM_API_URL must be a valid absolute URL/);
});

it('fails when LLM_API_KEY is missing', () => {
  expect(() =>
    validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      LLM_API_URL: 'https://api.deepseek.com/chat/completions',
      LLM_MODEL_NAME: 'deepseek-chat',
    }),
  ).toThrow(/LLM_API_KEY is required/);
});

it('fails when LLM_MODEL_NAME is missing', () => {
  expect(() =>
    validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      LLM_API_URL: 'https://api.deepseek.com/chat/completions',
      LLM_API_KEY: 'secret',
    }),
  ).toThrow(/LLM_MODEL_NAME is required/);
});
```

- [ ] **Step 2: Run the env validation tests to verify failure**

Run:

```bash
npm --workspace apps/backend run test -- env.validation.spec.ts
```

Expected:

```text
FAIL src/config/env.validation.spec.ts
```

The new tests should fail because `validateEnv` does not yet enforce `LLM_*` variables.

- [ ] **Step 3: Implement the env validation changes**

Update `apps/backend/src/config/env.validation.ts` with explicit checks like:

```ts
function isAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateEnv(config: EnvInput): EnvInput {
  const errors: string[] = [];

  const databaseUrl = getString(config.DATABASE_URL);
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  const llmApiUrl = getString(config.LLM_API_URL);
  if (!llmApiUrl) {
    errors.push('LLM_API_URL is required');
  } else if (!isAbsoluteUrl(llmApiUrl)) {
    errors.push('LLM_API_URL must be a valid absolute URL');
  }

  const llmApiKey = getString(config.LLM_API_KEY);
  if (!llmApiKey) {
    errors.push('LLM_API_KEY is required');
  }

  const llmModelName = getString(config.LLM_MODEL_NAME);
  if (!llmModelName) {
    errors.push('LLM_MODEL_NAME is required');
  }

  // keep existing REDIS_PORT and MOCK_AUTH validation
}
```

- [ ] **Step 4: Run the env validation tests to verify pass**

Run:

```bash
npm --workspace apps/backend run test -- env.validation.spec.ts
```

Expected:

```text
PASS src/config/env.validation.spec.ts
```

- [ ] **Step 5: Commit the env validation change**

```bash
git add apps/backend/src/config/env.validation.ts apps/backend/src/config/env.validation.spec.ts
git commit -m "test(backend): require llm env configuration"
```

### Task 2: Add LLM Config And Gateway

**Files:**
- Create: `apps/backend/src/ai/llm.config.ts`
- Create: `apps/backend/src/ai/llm.gateway.ts`
- Create: `apps/backend/src/ai/llm.gateway.spec.ts`
- Modify: `apps/backend/src/ai/ai.module.ts`
- Modify: `apps/backend/src/ai/ai.provider.interface.ts`
- Modify: `apps/backend/src/ai/ai.service.spec.ts`

- [ ] **Step 1: Write the failing gateway tests**

Create `apps/backend/src/ai/llm.gateway.spec.ts` with:

```ts
import { LlmGateway } from './llm.gateway';

describe('LlmGateway', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('posts prompt and configured model to the provider endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Page 1: Story text' } }],
      }),
    });

    const gateway = new LlmGateway({
      apiUrl: 'https://api.deepseek.com/chat/completions',
      apiKey: 'secret',
      modelName: 'deepseek-chat',
    });

    await gateway.generateStory('Tell a story', { model: 'openai:gpt-5.4-mini', reasoningEffort: 'MEDIUM' as never });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret',
        }),
        body: expect.stringContaining('"model":"deepseek-chat"'),
      }),
    );
  });

  it('returns story text from a valid provider response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Page 1: Hello' } }],
      }),
    });

    const gateway = new LlmGateway({
      apiUrl: 'https://api.deepseek.com/chat/completions',
      apiKey: 'secret',
      modelName: 'deepseek-chat',
    });

    await expect(
      gateway.generateStory('Tell a story', { model: 'ignored', reasoningEffort: 'MEDIUM' as never }),
    ).resolves.toBe('Page 1: Hello');
  });

  it('throws when the provider returns a non-2xx response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'upstream unavailable',
    });

    const gateway = new LlmGateway({
      apiUrl: 'https://api.deepseek.com/chat/completions',
      apiKey: 'secret',
      modelName: 'deepseek-chat',
    });

    await expect(
      gateway.generateStory('Tell a story', { model: 'ignored', reasoningEffort: 'MEDIUM' as never }),
    ).rejects.toThrow(/LLM request failed with status 503/);
  });

  it('throws when the provider response does not contain story text', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const gateway = new LlmGateway({
      apiUrl: 'https://api.deepseek.com/chat/completions',
      apiKey: 'secret',
      modelName: 'deepseek-chat',
    });

    await expect(
      gateway.generateStory('Tell a story', { model: 'ignored', reasoningEffort: 'MEDIUM' as never }),
    ).rejects.toThrow(/LLM response did not contain story text/);
  });
});
```

- [ ] **Step 2: Run the AI tests to verify failure**

Run:

```bash
npm --workspace apps/backend run test -- ai.service.spec.ts llm.gateway.spec.ts
```

Expected:

```text
FAIL src/ai/llm.gateway.spec.ts
```

The new spec should fail because `LlmGateway` and its config do not exist yet.

- [ ] **Step 3: Implement `llm.config.ts`, `llm.gateway.ts`, and module wiring**

Create `apps/backend/src/ai/llm.config.ts`:

```ts
import { ConfigService } from '@nestjs/config';

export type LlmConfig = {
  apiUrl: string;
  apiKey: string;
  modelName: string;
};

export function getLlmConfig(configService: ConfigService): LlmConfig {
  return {
    apiUrl: configService.getOrThrow<string>('LLM_API_URL'),
    apiKey: configService.getOrThrow<string>('LLM_API_KEY'),
    modelName: configService.getOrThrow<string>('LLM_MODEL_NAME'),
  };
}
```

Create `apps/backend/src/ai/llm.gateway.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { StoryGenerationOptions } from './ai.provider.interface';
import { LlmConfig } from './llm.config';

@Injectable()
export class LlmGateway {
  constructor(private readonly config: LlmConfig) {}

  async generateStory(prompt: string, _options: StoryGenerationOptions): Promise<string> {
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const story = data.choices?.[0]?.message?.content?.trim();
    if (!story) {
      throw new Error('LLM response did not contain story text');
    }

    return story;
  }
}
```

Update `apps/backend/src/ai/ai.module.ts` so the provider token uses the gateway:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN } from './ai.provider.interface';
import { LlmGateway } from './llm.gateway';
import { getLlmConfig } from './llm.config';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    {
      provide: AI_PROVIDER_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => new LlmGateway(getLlmConfig(configService)),
    },
  ],
  exports: [AiService],
})
export class AiModule {}
```

- [ ] **Step 4: Run the AI tests to verify pass**

Run:

```bash
npm --workspace apps/backend run test -- ai.service.spec.ts llm.gateway.spec.ts
```

Expected:

```text
PASS src/ai/ai.service.spec.ts
PASS src/ai/llm.gateway.spec.ts
```

- [ ] **Step 5: Commit the gateway change**

```bash
git add apps/backend/src/ai/ai.module.ts apps/backend/src/ai/ai.provider.interface.ts apps/backend/src/ai/ai.service.spec.ts apps/backend/src/ai/llm.config.ts apps/backend/src/ai/llm.gateway.ts apps/backend/src/ai/llm.gateway.spec.ts
git commit -m "feat(backend): add env-configured llm gateway"
```

### Task 3: Snapshot Env Model During Book Creation

**Files:**
- Modify: `apps/backend/src/book/book.service.ts`
- Modify: `apps/backend/src/book/book.service.spec.ts`

- [ ] **Step 1: Write the failing book snapshot test**

Replace the current model-default assertion in `apps/backend/src/book/book.service.spec.ts` with:

```ts
it('stores the active env model on a newly created book', async () => {
  const dto = {
    childId: 'child-1',
    type: 'AI_ADAPTED' as const,
    storyTitle: 'Cinderella',
    style: 'WATERCOLOR',
  };

  mockPrismaClient.user.findUnique.mockResolvedValue({
    id: 'user-1',
    preferredLlmModel: 'openai:gpt-5.4-mini',
    preferredReasoningEffort: ReasoningEffort.HIGH,
  });
  mockConfigService.getOrThrow.mockImplementation((key: string) => {
    if (key === 'LLM_MODEL_NAME') return 'deepseek-chat';
    throw new Error(`Unexpected key: ${key}`);
  });
  mockPrismaClient.book.create.mockResolvedValue({ id: 'book-1' });
  mockQueue.add.mockResolvedValue(undefined);

  await service.createAndGenerate(dto, 'user-1');

  expect(mockPrismaClient.book.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        llmModel: 'deepseek-chat',
        reasoningEffort: ReasoningEffort.HIGH,
      }),
    }),
  );
});
```

- [ ] **Step 2: Run the book service tests to verify failure**

Run:

```bash
npm --workspace apps/backend run test -- book.service.spec.ts
```

Expected:

```text
FAIL src/book/book.service.spec.ts
```

The test should fail because `BookService` does not yet read `LLM_MODEL_NAME` from config.

- [ ] **Step 3: Inject `ConfigService` and snapshot the env model**

Update the `BookService` constructor and create path in `apps/backend/src/book/book.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class BookService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('book-generation') private bookQueue: Queue,
    private pdfService: PdfService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  async createAndGenerate(dto: CreateBookDto, userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        preferredReasoningEffort: true,
      },
    });

    const activeModel = this.configService.getOrThrow<string>('LLM_MODEL_NAME');

    const book = await this.prisma.client.book.create({
      data: {
        llmModel: activeModel,
        reasoningEffort: user?.preferredReasoningEffort ?? DEFAULT_REASONING_EFFORT,
        // keep existing title, type, style, tone, status, userId, childId fields
      },
    });
  }
}
```

Update the test module in `apps/backend/src/book/book.service.spec.ts` to provide:

```ts
const mockConfigService = {
  getOrThrow: jest.fn(),
};
```

and register:

```ts
{ provide: ConfigService, useValue: mockConfigService },
```

- [ ] **Step 4: Run the book service tests to verify pass**

Run:

```bash
npm --workspace apps/backend run test -- book.service.spec.ts
```

Expected:

```text
PASS src/book/book.service.spec.ts
```

- [ ] **Step 5: Commit the book snapshot change**

```bash
git add apps/backend/src/book/book.service.ts apps/backend/src/book/book.service.spec.ts
git commit -m "feat(backend): snapshot active llm model on books"
```

### Task 4: Keep Processor Success And Failure Flow Intact

**Files:**
- Modify: `apps/backend/src/book-generation/book.processor.spec.ts`

- [ ] **Step 1: Tighten processor tests around gateway-backed behavior**

In `apps/backend/src/book-generation/book.processor.spec.ts`, keep the current `AiService` mock but add expectations that the processor still treats the service as an opaque dependency:

```ts
it('marks the book as failed and rethrows when story generation fails', async () => {
  const bookId = 'failed-book-id';
  const error = new Error('LLM request failed with status 503');

  mockPrismaClient.book.findUnique.mockResolvedValue({
    id: bookId,
    title: 'Failure Test',
    llmModel: 'deepseek-chat',
    reasoningEffort: ReasoningEffort.MEDIUM,
    child: { name: 'Eve', age: 8, gender: 'female', interests: ['space'] },
  });
  mockAiService.generateStory.mockRejectedValue(error);

  await expect(processor.process({ data: { bookId } } as Job)).rejects.toThrow(
    'LLM request failed with status 503',
  );

  expect(prisma.client.book.update).toHaveBeenNthCalledWith(1, {
    where: { id: bookId },
    data: { status: BookStatus.GENERATING },
  });
  expect(prisma.client.book.update).toHaveBeenNthCalledWith(2, {
    where: { id: bookId },
    data: { status: BookStatus.FAILED },
  });
});
```

Keep the success-path assertion that pages are created and `REVIEW` is written.

- [ ] **Step 2: Run the processor tests to verify current baseline**

Run:

```bash
npm --workspace apps/backend run test -- book.processor.spec.ts
```

Expected:

```text
PASS src/book-generation/book.processor.spec.ts
```

If the suite already passes after the assertion updates, continue without changing production code.

- [ ] **Step 3: Adjust processor code only if the tighter tests expose drift**

If needed, keep `apps/backend/src/book-generation/book.processor.ts` aligned with this behavior:

```ts
try {
  const storyText = await this.aiService.generateStory(storyPrompt, {
    model: book.llmModel,
    reasoningEffort: book.reasoningEffort,
  });

  // page creation transaction
} catch (error) {
  await this.prisma.client.book.update({
    where: { id: book.id },
    data: { status: BookStatus.FAILED },
  });

  throw error;
}
```

Do not introduce provider-specific parsing or error inspection here.

- [ ] **Step 4: Run the processor tests again**

Run:

```bash
npm --workspace apps/backend run test -- book.processor.spec.ts
```

Expected:

```text
PASS src/book-generation/book.processor.spec.ts
```

- [ ] **Step 5: Commit the processor verification change**

```bash
git add apps/backend/src/book-generation/book.processor.spec.ts apps/backend/src/book-generation/book.processor.ts
git commit -m "test(backend): lock processor llm failure behavior"
```

### Task 5: Remove Mock Runtime Wiring And Align Examples

**Files:**
- Delete: `apps/backend/src/ai/mock-ai.service.ts`
- Delete: `apps/backend/src/ai/mock-ai.service.spec.ts`
- Modify: `apps/backend/.env.example`

- [ ] **Step 1: Remove mock-only files after gateway wiring is green**

Delete:

```text
apps/backend/src/ai/mock-ai.service.ts
apps/backend/src/ai/mock-ai.service.spec.ts
```

The runtime path should now be the real env-driven gateway, so these files are dead code.

- [ ] **Step 2: Update `.env.example` to match the validated contract**

Ensure `apps/backend/.env.example` keeps explicit required examples:

```env
LLM_API_URL=https://api.deepseek.com/chat/completions
LLM_API_KEY=replace-me
LLM_MODEL_NAME=deepseek-chat
```

Keep them under the backend required or clearly-labeled integration section so local setup matches startup validation.

- [ ] **Step 3: Run the focused backend suite**

Run:

```bash
npm --workspace apps/backend run test -- env.validation.spec.ts ai.service.spec.ts llm.gateway.spec.ts book.service.spec.ts book.processor.spec.ts
```

Expected:

```text
PASS src/config/env.validation.spec.ts
PASS src/ai/ai.service.spec.ts
PASS src/ai/llm.gateway.spec.ts
PASS src/book/book.service.spec.ts
PASS src/book-generation/book.processor.spec.ts
```

- [ ] **Step 4: Run backend typecheck**

Run:

```bash
npm --workspace apps/backend run typecheck
```

Expected:

```text
Found 0 errors.
```

- [ ] **Step 5: Commit the cleanup and docs alignment**

```bash
git add apps/backend/.env.example apps/backend/src/ai/ai.module.ts apps/backend/src/ai/llm.config.ts apps/backend/src/ai/llm.gateway.ts apps/backend/src/ai/llm.gateway.spec.ts apps/backend/src/config/env.validation.ts apps/backend/src/config/env.validation.spec.ts apps/backend/src/book/book.service.ts apps/backend/src/book/book.service.spec.ts apps/backend/src/book-generation/book.processor.spec.ts
git rm apps/backend/src/ai/mock-ai.service.ts apps/backend/src/ai/mock-ai.service.spec.ts
git commit -m "feat(backend): switch book generation to env llm api"
```

## Self-Review

- Spec coverage:
  - required `LLM_*` startup validation is covered in Task 1
  - dedicated `LlmGateway` and config boundary are covered in Task 2
  - `book.llmModel` snapshot from env is covered in Task 3
  - `FAILED` and `REVIEW` lifecycle behavior is covered in Task 4
  - `.env.example` and mock runtime removal are covered in Task 5
- Placeholder scan:
  - no `TODO`, `TBD`, or “implement later” markers remain
  - each task includes concrete files, code targets, commands, and expected outcomes
- Type consistency:
  - plan uses `LlmGateway`, `getLlmConfig`, `LLM_MODEL_NAME`, and `StoryGenerationOptions` consistently across tasks
