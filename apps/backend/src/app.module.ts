import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from './ai/ai.module';
import { BookGenerationModule } from './book-generation/book-generation.module';
import { StorageModule } from './storage/storage.module';
import { PdfModule } from './pdf/pdf.module';
import { BookModule } from './book/book.module';
import { PaymentModule } from './payment/payment.module';
import { ChildProfileModule } from './child-profile/child-profile.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    AiModule,
    BookGenerationModule,
    StorageModule,
    PdfModule,
    BookModule,
    PaymentModule,
    ChildProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
