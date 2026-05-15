import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BookProcessor } from './book.processor';
import { AiModule } from '../ai/ai.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'book-generation',
    }),
    AiModule,
  ],
  providers: [BookProcessor, PrismaService],
  exports: [BullModule],
})
export class BookGenerationModule {}
