import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StoryLibraryService } from './story-library.service';
import { MockAuthGuard } from '../mock-auth.guard';

@Controller('stories')
@UseGuards(MockAuthGuard)
export class StoryLibraryController {
  constructor(private readonly service: StoryLibraryService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.findAll({
      search,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
    });
  }
}
