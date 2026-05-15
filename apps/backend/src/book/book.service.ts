import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@repo/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BookService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('book-generation') private bookQueue: Queue,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BookWhereInput;
  }) {
    const { skip, take, where } = params;
    return this.prisma.client.book.findMany({
      skip,
      take,
      where,
      include: {
        pages: {
          include: {
            illustrations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async triggerGeneration(bookId: string) {
    await this.bookQueue.add('generate-book', { bookId });
    return { bookId, status: 'QUEUED' };
  }
}
