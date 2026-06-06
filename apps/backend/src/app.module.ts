import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from './ai/ai.module';
import { BookGenerationModule } from './book-generation/book-generation.module';
import { StorageModule } from './storage/storage.module';
import { PdfModule } from './pdf/pdf.module';
import { BookModule } from './book/book.module';
import { PaymentModule } from './payment/payment.module';
import { ChildProfileModule } from './child-profile/child-profile.module';
import { StoryLibraryModule } from './story-library/story-library.module';
import { PrismaModule } from './prisma.module';
import { BACKEND_ENV_FILE_PATH } from './config/env-file-path';
import { validateEnv } from './config/env.validation';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: BACKEND_ENV_FILE_PATH,
      validate: validateEnv,
    }),
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
    StoryLibraryModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
