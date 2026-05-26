import { Module } from '@nestjs/common';
import { StoryLibraryController } from './story-library.controller';
import { StoryLibraryService } from './story-library.service';

@Module({
  controllers: [StoryLibraryController],
  providers: [StoryLibraryService],
  exports: [StoryLibraryService],
})
export class StoryLibraryModule {}
