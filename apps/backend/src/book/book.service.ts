import type { Queue } from 'bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { BookStatus, BookStyle, ReasoningEffort, Tone } from '@repo/database';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PrismaService } from '../prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';

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
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  childId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  childName?: string;

  @IsOptional()
  page?: string | number;

  @IsOptional()
  limit?: string | number;
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

const DEFAULT_REASONING_EFFORT = ReasoningEffort.MEDIUM;
const STALE_GENERATING_BOOK_AGE_MS = 10 * 60 * 1000;
const MAX_PARENT_EDIT_LENGTH = 2000;

function normalizeEnumValue<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fieldName: string
): T | undefined {
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
    private configService: ConfigService
  ) {}

  private async ensureGenerationQueueReady() {
    try {
      await this.bookQueue.waitUntilReady();
    } catch {
      throw new ServiceUnavailableException('Book generation queue is unavailable');
    }
  }

  async findAll(params: { skip?: number; take?: number; where?: Record<string, unknown> }) {
    const { skip, take, where } = params;
    const staleGenerationCutoff = new Date(Date.now() - STALE_GENERATING_BOOK_AGE_MS);
    const scopeUserId = (where as { userId?: unknown } | undefined)?.userId;

    await this.prisma.client.book.updateMany({
      where: {
        status: BookStatus.GENERATING,
        updatedAt: { lt: staleGenerationCutoff },
        ...(typeof scopeUserId === 'string' ? { userId: scopeUserId } : {}),
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
            orderBy: { pageNumber: 'asc' },
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

    const child = await this.prisma.client.childProfile.findFirst({
      where: { id: dto.childId, userId },
      select: { id: true },
    });
    if (!child) throw new NotFoundException('Child profile not found');

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

  async getById(bookId: string, userId: string) {
    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      include: {
        child: { select: { id: true, name: true, age: true } },
        pages: { orderBy: { pageNumber: 'asc' } },
      },
    });

    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async getPreview(bookId: string, userId: string) {
    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: { illustrations: true },
        },
      },
    });

    if (!book) throw new NotFoundException('Book not found');
    if (book.status === BookStatus.DRAFT || book.status === BookStatus.GENERATING) {
      throw new ConflictException('Book is still being generated');
    }

    if (book.status === BookStatus.COMPLETED) {
      return { book, pdfUrl: book.pdfUrl, redirectToDetail: true };
    }

    return { book };
  }

  async approveBook(bookId: string, userId: string) {
    const updated = await this.prisma.client.book.updateMany({
      where: { id: bookId, userId, status: BookStatus.REVIEW },
      data: { status: BookStatus.COMPLETED, approvedAt: new Date() },
    });

    if (updated.count === 0) {
      const book = await this.prisma.client.book.findFirst({
        where: { id: bookId, userId },
        select: { id: true, status: true },
      });
      if (!book) throw new NotFoundException('Book not found');
      throw new ConflictException('Book must be in REVIEW status to approve');
    }

    return { status: BookStatus.COMPLETED };
  }

  async editPage(bookId: string, pageNumber: number, dto: PageEditDto, userId: string) {
    if (dto.feedback && dto.feedback.length > MAX_PARENT_EDIT_LENGTH) {
      throw new BadRequestException('Parent feedback is too long');
    }

    const page = await this.prisma.client.page.findUnique({
      where: { bookId_pageNumber: { bookId, pageNumber } },
    });

    if (!page) throw new NotFoundException('Page not found');

    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      select: { id: true },
    });
    if (!book) throw new NotFoundException('Book not found');

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

  async regenerate(bookId: string, dto: RegenerateDto, userId: string) {
    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      select: { id: true },
    });
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

  async getPdfUrl(bookId: string, userId: string) {
    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      select: { pdfUrl: true },
    });
    if (!book?.pdfUrl) throw new NotFoundException('PDF not available');
    return { pdfUrl: book.pdfUrl };
  }
}
