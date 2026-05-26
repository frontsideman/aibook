import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BookStatus } from '@repo/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';

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

@Injectable()
export class BookService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('book-generation') private bookQueue: Queue,
    private pdfService: PdfService,
    private storageService: StorageService,
  ) {}

  async findAll(params: { skip?: number; take?: number; where?: any }) {
    const { skip, take, where } = params;
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
    const book = await this.prisma.client.book.create({
      data: {
        title: dto.storyTitle || (dto.userContent ? dto.userContent.slice(0, 50) : 'New Book'),
        type: dto.type,
        style: dto.style,
        tone: dto.tone,
        parentComments: dto.parentComments,
        status: BookStatus.DRAFT,
        userId,
        childId: dto.childId,
      },
    });

    await this.bookQueue.add('generate-book', { bookId: book.id });
    return { bookId: book.id, status: 'DRAFT' };
  }

  async triggerGeneration(bookId: string) {
    await this.bookQueue.add('generate-book', { bookId });
    return { bookId, status: 'QUEUED' };
  }

  async getPreview(bookId: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
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

  async approveBook(bookId: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: { illustrations: true },
        },
      },
    });

    if (!book) throw new NotFoundException('Book not found');

    const pages = book.pages.map((p: { textContent: string; illustrations: { url?: string }[] }) => ({
      text: p.textContent,
      imageUrl: p.illustrations[0]?.url,
    }));

    const pdfBuffer = await this.pdfService.generateBookPdf(pages);
    const pdfKey = `books/${bookId}/book.pdf`;
    await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');

    const pdfUrl = `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${process.env.S3_BUCKET || 'test-bucket'}/${pdfKey}`;

    await this.prisma.client.book.update({
      where: { id: bookId },
      data: { status: BookStatus.COMPLETED, pdfUrl, approvedAt: new Date() },
    });

    return { pdfUrl };
  }

  async editPage(bookId: string, pageNumber: number, dto: PageEditDto) {
    const page = await this.prisma.client.page.findUnique({
      where: { bookId_pageNumber: { bookId, pageNumber } },
    });

    if (!page) throw new NotFoundException('Page not found');

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

  async regenerate(bookId: string, dto: RegenerateDto) {
    const book = await this.prisma.client.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');

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

  async getPdfUrl(bookId: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
      select: { pdfUrl: true },
    });
    if (!book?.pdfUrl) throw new NotFoundException('PDF not available');
    return { pdfUrl: book.pdfUrl };
  }
}
