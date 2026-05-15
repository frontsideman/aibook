import { Module } from '@nestjs/common';
import { BookProcessor } from './book.processor';
import { AiModule } from '../ai/ai.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    QueueModule,
    AiModule,
  ],
  providers: [BookProcessor],
  exports: [QueueModule],
})
export class BookGenerationModule {}
