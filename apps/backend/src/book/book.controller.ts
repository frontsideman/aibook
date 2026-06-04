import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req, ParseIntPipe,
} from '@nestjs/common';
import { BookService, CreateBookDto, SearchQueryDto, PageEditDto, RegenerateDto } from './book.service';
import { SubscriptionGuard } from '../payment/subscription.guard';
import { MockAuthGuard } from '../mock-auth.guard';

@Controller('books')
@UseGuards(MockAuthGuard)
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async findAll(@Query() query: SearchQueryDto, @Req() req: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user.id };
    if (query.title) where.title = { contains: query.title, mode: 'insensitive' };
    if (query.style) where.style = query.style;
    if (query.status) where.status = query.status;
    if (query.childId) where.childId = query.childId;

    return this.bookService.findAll({ skip, take: limit, where });
  }

  @Post('generate')
  @UseGuards(SubscriptionGuard)
  async generate(@Body() body: CreateBookDto, @Req() req: any) {
    return this.bookService.createAndGenerate(body, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.bookService.getById(id, req.user.id);
  }

  @Get(':id/preview')
  async preview(@Param('id') id: string, @Req() req: any) {
    return this.bookService.getPreview(id, req.user.id);
  }

  @Patch(':id/pages/:pageNumber')
  async editPage(
    @Param('id') id: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() body: PageEditDto,
    @Req() req: any,
  ) {
    return this.bookService.editPage(id, pageNumber, body, req.user.id);
  }

  @Patch(':id/regenerate')
  async regenerate(@Param('id') id: string, @Body() body: RegenerateDto, @Req() req: any) {
    return this.bookService.regenerate(id, body, req.user.id);
  }

  @Post(':id/approve')
  @UseGuards(SubscriptionGuard)
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.bookService.approveBook(id, req.user.id);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Req() req: any) {
    return this.bookService.getPdfUrl(id, req.user.id);
  }
}
