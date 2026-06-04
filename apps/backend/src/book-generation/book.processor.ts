import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { BookStatus, Prisma } from '@repo/database';

@Processor('book-generation')
export class BookProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<{ bookId: string; parentFeedback?: string }>): Promise<any> {
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
      let storyPrompt = `Generate a children's book story titled "${book.title}" for a ${book.child.age} year old ${book.child.gender} who likes ${(book.child.interests || []).join(', ')}.`;

      if (book.tone) {
        storyPrompt += ` The tone should be ${book.tone.toLowerCase()}.`;
      }

      if (book.parentComments) {
        storyPrompt += ` Parent instructions: ${book.parentComments}.`;
      }

      if (parentFeedback) {
        storyPrompt += ` The parent requested changes: ${parentFeedback}. Revise the story accordingly.`;
      }

      storyPrompt += ` The story should be between 3 and 20 pages long. Format each page as "Page X: [content]".`;

      const storyText = await this.aiService.generateStory(storyPrompt, {
        model: book.llmModel,
        reasoningEffort: book.reasoningEffort,
      });
      const pagesContent = storyText
        .split(/Page \d+:/)
        .map(c => c.trim())
        .filter(content => content.length > 0);

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
