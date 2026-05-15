import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BookService } from './book.service';
import { Prisma } from '@repo/database';
import { SubscriptionGuard } from '../payment/subscription.guard';

export class SearchQueryDto {
  title?: string;
  style?: string;
  page?: string | number;
  limit?: string | number;
}

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async findAll(@Query() query: SearchQueryDto) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

    if (query.title) {
      where.title = { contains: query.title, mode: 'insensitive' };
    }

    if (query.style) {
      where.style = { contains: query.style, mode: 'insensitive' };
    }

    return this.bookService.findAll({
      skip,
      take: limit,
      where,
    });
  }

  @Post('generate')
  @UseGuards(SubscriptionGuard)
  async generate(@Body() body: { bookId: string }) {
    // This will trigger the BullMQ job via the BookService
    return this.bookService.triggerGeneration(body.bookId);
  }
}
