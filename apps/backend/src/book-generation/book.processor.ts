import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UnrecoverableError, type Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { PromptBuilderService } from './prompt-builder.service';
import { parseStoryPages } from './story-pages';
import { BookStatus, type Prisma } from '@repo/database';

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
      throw new UnrecoverableError(`Book with id ${bookId} not found`);
    }

    if (book.status !== BookStatus.GENERATING) {
      throw new UnrecoverableError(`Book ${bookId} is not GENERATING (status=${book.status})`);
    }

    try {
      const storyPrompt = this.promptBuilder.buildPrompt(book, parentFeedback);

      const storyText = await this.aiService.generateStory(storyPrompt, {
        model: book.llmModel,
        reasoningEffort: book.reasoningEffort,
      });

      const pagesContent = parseStoryPages(storyText);

      if (pagesContent.length <= 1) {
        throw new UnrecoverableError(
          `Failed to parse story into pages — only ${pagesContent.length} segment(s) found`
        );
      }

      await this.prisma.client.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.page.deleteMany({ where: { bookId: book.id } });

        for (let i = 0; i < pagesContent.length; i++) {
          await tx.page.create({
            data: {
              bookId: book.id,
              pageNumber: i + 1,
              textContent: pagesContent[i],
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
