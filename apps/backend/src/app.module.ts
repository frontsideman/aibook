import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from './prisma.service';
import { ChildProfileService } from './child-profile/child-profile.service';
import { ChildProfileController } from './child-profile/child-profile.controller';
import { AiModule } from './ai/ai.module';
import { BookGenerationModule } from './book-generation/book-generation.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    AiModule,
    BookGenerationModule,
  ],
  controllers: [ChildProfileController],
  providers: [PrismaService, ChildProfileService],
  exports: [PrismaService],
})
export class AppModule {}
