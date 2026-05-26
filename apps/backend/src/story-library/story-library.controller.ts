import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StoryLibraryService } from './story-library.service';
import { MockAuthGuard } from '../mock-auth.guard';

@Controller('stories')
@UseGuards(MockAuthGuard)
export class StoryLibraryController {
  constructor(private readonly service: StoryLibraryService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }
}
