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
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PrismaService } from '../prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { getAvailableLlmModels } from '../ai/llm.config';

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
  @IsIn(Object.values(BookStyle))
  style?: string;

  @IsOptional()
  @IsIn(Object.values(BookStatus))
  status?: string;

  @IsOptional()
  @IsString()
  childId?: string;

  @IsOptional()
  @IsIn(['AI_ADAPTED', 'MANUAL'])
  type?: string;

  @IsOptional()
  @IsString()
  childName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(['updated', 'title'])
  sort?: 'updated' | 'title';
}

export class PageEditDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

export class RegenerateDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  parentFeedback?: string;
}

const DEFAULT_REASONING_EFFORT = ReasoningEffort.MEDIUM;
const STALE_GENERATING_BOOK_AGE_MS = 10 * 60 * 1000;
const REGENERATABLE_STATUSES: BookStatus[] = [BookStatus.REVIEW, BookStatus.FAILED];

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

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Record<string, unknown>;
    sort?: 'updated' | 'title';
  }) {
    const { skip, take, where, sort = 'updated' } = params;
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

    const countWhere: Record<string, unknown> = where ? { ...where } : {};
    delete countWhere.status;

    const [books, total, statusGroups] = await Promise.all([
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
        orderBy: sort === 'title' ? { title: 'asc' } : { updatedAt: 'desc' },
      }),
      this.prisma.client.book.count({ where }),
      this.prisma.client.book.groupBy({
        by: ['status'],
        where: countWhere,
        _count: { _all: true },
      }),
    ]);

    const page = skip != null && take ? Math.floor(skip / take) + 1 : 1;
    const totalPages = take ? Math.ceil(total / take) : 1;
    const statusCounts = Object.fromEntries(
      statusGroups.map((group) => [group.status, group._count._all])
    );

    return { books, total, page, totalPages, statusCounts };
  }

  async createAndGenerate(dto: CreateBookDto, userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        preferredLlmModel: true,
        preferredReasoningEffort: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const child = await this.prisma.client.childProfile.findFirst({
      where: { id: dto.childId, userId },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException('Child profile not found');
    }

    const availableModels = getAvailableLlmModels(this.configService);
    const defaultModel = this.configService.getOrThrow<string>('LLM_MODEL_NAME');
    const activeModel =
      user.preferredLlmModel && availableModels.includes(user.preferredLlmModel)
        ? user.preferredLlmModel
        : defaultModel;
    const style = normalizeEnumValue(dto.style, Object.values(BookStyle), 'book style');
    const tone = normalizeEnumValue(dto.tone, Object.values(Tone), 'book tone');

    if (!style) {
      throw new BadRequestException('Book style is required');
    }

    await this.ensureGenerationQueueReady();

    const title =
      dto.storyTitle?.trim() ||
      (dto.userContent ? dto.userContent.trim().slice(0, 50) : 'New Book') ||
      'New Book';

    const book = await this.prisma.client.book.create({
      data: {
        title,
        type: dto.type,
        style,
        llmModel: activeModel,
        reasoningEffort: user.preferredReasoningEffort ?? DEFAULT_REASONING_EFFORT,
        tone,
        parentComments: dto.parentComments?.trim() || undefined,
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
    if (
      book.status === BookStatus.DRAFT ||
      book.status === BookStatus.GENERATING ||
      book.status === BookStatus.FAILED
    ) {
      throw new ConflictException('Book is not ready for review');
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
    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      select: { id: true, status: true },
    });
    if (!book) throw new NotFoundException('Book not found');
    if (book.status !== BookStatus.REVIEW) {
      throw new ConflictException('Pages can only be edited while the book is in review');
    }

    const page = await this.prisma.client.page.findUnique({
      where: { bookId_pageNumber: { bookId, pageNumber } },
    });

    if (!page) throw new NotFoundException('Page not found');

    return this.prisma.client.page.update({
      where: { id: page.id },
      data: {
        textContent: dto.feedback
          ? `${page.textContent}\n\n[Parent edit: ${dto.feedback}]`
          : page.textContent,
      },
      include: { illustrations: true },
    });
  }

  async regenerate(bookId: string, dto: RegenerateDto, userId: string) {
    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      select: { id: true, status: true },
    });
    if (!book) throw new NotFoundException('Book not found');

    if (!REGENERATABLE_STATUSES.includes(book.status)) {
      throw new ConflictException('Book cannot be regenerated in its current status');
    }

    await this.ensureGenerationQueueReady();

    const previousStatus = book.status;
    const parentFeedback = dto.parentFeedback?.trim() || undefined;

    const updated = await this.prisma.client.book.updateMany({
      where: { id: bookId, userId, status: previousStatus },
      data: {
        status: BookStatus.GENERATING,
        parentFeedback,
      },
    });

    if (updated.count === 0) {
      throw new ConflictException('Book status changed before regeneration started');
    }

    try {
      await this.bookQueue.add('generate-book', {
        bookId,
        parentFeedback,
      });
    } catch {
      await this.prisma.client.book.update({
        where: { id: bookId },
        data: { status: previousStatus },
      });
      throw new ServiceUnavailableException('Book generation queue is unavailable');
    }

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

  async createPdf(bookId: string, userId: string) {
    const book = await this.prisma.client.book.findFirst({
      where: { id: bookId, userId },
      select: {
        id: true,
        status: true,
        pdfUrl: true,
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: { illustrations: { take: 1 } },
        },
      },
    });

    if (!book) throw new NotFoundException('Book not found');
    if (book.status !== BookStatus.COMPLETED) {
      throw new ConflictException('Book must be completed before creating a PDF');
    }
    if (book.pdfUrl) return { pdfUrl: book.pdfUrl };

    const pdfBuffer = await this.pdfService.generateBookPdf(
      book.pages.map((page) => ({
        text: page.textContent,
        imageUrl: page.illustrations[0]?.url ?? undefined,
      }))
    );

    const pdfKey = `books/${book.id}/book.pdf`;

    try {
      await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');
    } catch {
      throw new ServiceUnavailableException('PDF storage is unavailable');
    }

    const pdfUrl = this.storageService.getPublicUrl(pdfKey);
    await this.prisma.client.book.update({
      where: { id: book.id },
      data: { pdfUrl },
    });

    return { pdfUrl };
  }
}
