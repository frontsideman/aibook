import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BookStatus, BookStyle, ReasoningEffort, Tone } from '@repo/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';

export class CreateBookDto {
  childId: string;
  type: 'AI_ADAPTED' | 'MANUAL';
  storyTitle?: string;
  userContent?: string;
  parentComments?: string;
  tone?: string;
  style: string;
}

export class SearchQueryDto {
  title?: string;
  search?: string;
  style?: string;
  status?: string;
  childId?: string;
  page?: string | number;
  limit?: string | number;
}

export class PageEditDto {
  feedback?: string;
}

export class RegenerateDto {
  parentFeedback: string;
}

const DEFAULT_REASONING_EFFORT = ReasoningEffort.MEDIUM;
const STALE_GENERATING_BOOK_AGE_MS = 10 * 60 * 1000;

function normalizeEnumValue<T extends string>(value: string | undefined, allowed: readonly T[], fieldName: string): T | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toUpperCase() as T;
  if (!allowed.includes(normalized)) {
    throw new BadRequestException(`Invalid ${fieldName}`);
  }

  return normalized;
}

@Injectable()
export class BookService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('book-generation') private bookQueue: Queue,
    private pdfService: PdfService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  private async ensureGenerationQueueReady() {
    try {
      await this.bookQueue.waitUntilReady();
    } catch {
      throw new ServiceUnavailableException('Book generation queue is unavailable');
    }
  }

  async findAll(params: { skip?: number; take?: number; where?: any }) {
    const { skip, take, where } = params;
    const staleGenerationCutoff = new Date(Date.now() - STALE_GENERATING_BOOK_AGE_MS);

    await this.prisma.client.book.updateMany({
      where: {
        status: BookStatus.GENERATING,
        updatedAt: { lt: staleGenerationCutoff },
      },
      data: { status: BookStatus.FAILED },
    });

    const [books, total] = await Promise.all([
      this.prisma.client.book.findMany({
        skip,
        take,
        where,
        include: {
          child: { select: { name: true } },
          pages: {
            take: 1,
            include: { illustrations: { take: 1 } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.book.count({ where }),
    ]);

    const page = skip != null && take ? Math.floor(skip / take) + 1 : 1;
    const totalPages = take ? Math.ceil(total / take) : 1;

    return { books, total, page, totalPages };
  }

  async createAndGenerate(dto: CreateBookDto, userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        preferredReasoningEffort: true,
      },
    });
    const activeModel = this.configService.getOrThrow('LLM_MODEL_NAME');
    const style = normalizeEnumValue(dto.style, Object.values(BookStyle), 'book style');
    const tone = normalizeEnumValue(dto.tone, Object.values(Tone), 'book tone');

    if (!style) {
      throw new BadRequestException('Book style is required');
    }

    await this.ensureGenerationQueueReady();

    const book = await this.prisma.client.book.create({
      data: {
        title: dto.storyTitle || (dto.userContent ? dto.userContent.slice(0, 50) : 'New Book'),
        type: dto.type,
        style,
        llmModel: activeModel,
        reasoningEffort: user?.preferredReasoningEffort ?? DEFAULT_REASONING_EFFORT,
        tone,
        parentComments: dto.parentComments,
        status: BookStatus.GENERATING,
        userId,
        childId: dto.childId,
      },
    });

    try {
      await this.bookQueue.add('generate-book', { bookId: book.id });
    } catch {
      await this.prisma.client.book.update({
        where: { id: book.id },
        data: { status: BookStatus.FAILED },
      });
      throw new ServiceUnavailableException('Book generation queue is unavailable');
    }

    return { bookId: book.id, status: 'GENERATING' };
  }

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

  async triggerGeneration(bookId: string) {
    await this.ensureGenerationQueueReady();
    await this.bookQueue.add('generate-book', { bookId });
    return { bookId, status: 'QUEUED' };
  }

  async getPreview(bookId: string, userId?: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId, ...(userId ? { userId } : {}) },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: { illustrations: true },
        },
      },
    });

    if (!book) throw new NotFoundException('Book not found');
    if (book.status === BookStatus.DRAFT || book.status === BookStatus.GENERATING) {
      throw new NotFoundException('Book is still being generated');
    }

    if (book.status === BookStatus.COMPLETED) {
      return { book, pdfUrl: book.pdfUrl, redirectToDetail: true };
    }

    return { book };
  }

  async approveBook(bookId: string, userId?: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId, ...(userId ? { userId } : {}) },
    });

    if (!book) throw new NotFoundException('Book not found');
    if (book.status !== BookStatus.REVIEW) {
      throw new NotFoundException('Book must be in REVIEW status to approve');
    }

    await this.prisma.client.book.update({
      where: { id: bookId },
      data: { status: BookStatus.COMPLETED, approvedAt: new Date() },
    });

    return { status: BookStatus.COMPLETED };
  }

  async editPage(bookId: string, pageNumber: number, dto: PageEditDto, userId?: string) {
    const page = await this.prisma.client.page.findUnique({
      where: { bookId_pageNumber: { bookId, pageNumber } },
    });

    if (!page) throw new NotFoundException('Page not found');

    if (userId) {
      const book = await this.prisma.client.book.findUnique({
        where: { id: bookId, userId },
        select: { id: true },
      });
      if (!book) throw new NotFoundException('Book not found');
    }

    const updated = await this.prisma.client.page.update({
      where: { id: page.id },
      data: {
        textContent: dto.feedback
          ? `${page.textContent}\n\n[Parent edit: ${dto.feedback}]`
          : page.textContent,
      },
      include: { illustrations: true },
    });

    return updated;
  }

  async regenerate(bookId: string, dto: RegenerateDto, userId?: string) {
    const book = await this.prisma.client.book.findUnique({ where: { id: bookId, ...(userId ? { userId } : {}) } });
    if (!book) throw new NotFoundException('Book not found');

    await this.ensureGenerationQueueReady();

    await this.prisma.client.book.update({
      where: { id: bookId },
      data: {
        status: BookStatus.GENERATING,
        parentFeedback: dto.parentFeedback,
      },
    });

    await this.prisma.client.page.deleteMany({ where: { bookId } });

    await this.bookQueue.add('generate-book', {
      bookId,
      parentFeedback: dto.parentFeedback,
    });

    return { bookId, status: 'REGENERATING' };
  }

  async getPdfUrl(bookId: string, userId?: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId, ...(userId ? { userId } : {}) },
      select: { pdfUrl: true },
    });
    if (!book?.pdfUrl) throw new NotFoundException('PDF not available');
    return { pdfUrl: book.pdfUrl };
  }
}
