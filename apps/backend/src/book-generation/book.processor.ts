import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { PromptBuilderService } from './prompt-builder.service';
import { BookStatus, Prisma } from '@repo/database';

@Processor('book-generation')
export class BookProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly promptBuilder: PromptBuilderService
  ) {
    super();
  }

  async process(job: Job<{ bookId: string; parentFeedback?: string }>): Promise<{ success: true }> {
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
      const storyPrompt = this.promptBuilder.buildPrompt(book, parentFeedback);

      const storyText = await this.aiService.generateStory(storyPrompt, {
        model: book.llmModel,
        reasoningEffort: book.reasoningEffort,
      });

      // Support multiple LLM page formats: "Page 1:", "**Page 1:**", "Page 1.", etc.
      const cleaned = storyText.replace(/\*\*/g, '').trim();
      let pagesContent = cleaned
        .split(/Page \d+[\.:]\s*/)
        .map((c) => c.trim())
        .filter((content) => content.length > 0);

      if (pagesContent.length <= 1) {
        // if the regex failed to split, fall back to double newline splitting
        pagesContent = storyText
          .split(/\n\n+/)
          .map((c) => c.trim())
          .filter((content) => content.length > 0);
      }

      if (pagesContent.length <= 1) {
        throw new Error(
          `Failed to parse story into pages — only ${pagesContent.length} segment(s) found`
        );
      }

      await this.prisma.client.$transaction(async (tx: Prisma.TransactionClient) => {
        for (let i = 0; i < pagesContent.length; i++) {
          const trimmedContent = pagesContent[i];
          const pageNumber = i + 1;

          await tx.page.create({
            data: {
              bookId: book.id,
              pageNumber,
              textContent: trimmedContent,
            },
          });
        }

        await tx.book.update({
          where: { id: book.id },
          data: { status: BookStatus.REVIEW },
        });
      });

      return { success: true };
    } catch (error) {
      await this.prisma.client.book.update({
        where: { id: book.id },
        data: { status: BookStatus.FAILED },
      });

      throw error;
    }
  }
}
