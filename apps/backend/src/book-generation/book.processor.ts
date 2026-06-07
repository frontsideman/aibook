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
      const childInterests = (book.child.interests || []).join(', ') || 'no specific interests listed';
      const storyPrompt = [
        'You are writing an original children\'s book adaptation.',
        `Use the classic story titled "${book.title}" as the source tale and rely on your knowledge of that story to recreate its key characters and plot beats.`,
        `Child profile: ${book.child.name}, a ${book.child.age}-year-old ${book.child.gender} child who likes ${childInterests}.`,
        `Style: ${book.style.toLowerCase()}.`,
        book.tone ? `Tone: ${book.tone.toLowerCase()}.` : null,
        book.parentComments ? `Parent instructions: ${book.parentComments}.` : null,
        parentFeedback ? `Parent requested changes: ${parentFeedback}. Revise the story accordingly.` : null,
        'Write a fresh, age-appropriate adaptation that follows the original story structure, but do not copy the source text verbatim.',
        'Return 3 to 20 pages.',
        'Format the output strictly as:',
        'Page 1: ...',
        'Page 2: ...',
        'Page 3: ...',
      ]
        .filter(Boolean)
        .join(' ');

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
