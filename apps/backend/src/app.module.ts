import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from './prisma.service';
import { ChildProfileService } from './child-profile/child-profile.service';
import { ChildProfileController } from './child-profile/child-profile.controller';
import { AiModule } from './ai/ai.module';
import { BookGenerationModule } from './book-generation/book-generation.module';
import { StorageModule } from './storage/storage.module';
import { PdfModule } from './pdf/pdf.module';
import { BookModule } from './book/book.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    AiModule,
    BookGenerationModule,
    StorageModule,
    PdfModule,
    BookModule,
    PaymentModule,
  ],
  controllers: [ChildProfileController],
  providers: [PrismaService, ChildProfileService],
  exports: [PrismaService],
})
export class AppModule {}
