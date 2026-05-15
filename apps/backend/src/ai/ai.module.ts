import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN } from './ai.provider.interface';
import { MockAiService } from './mock-ai.service';

@Module({
  providers: [
    AiService,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: MockAiService,
    },
  ],
  exports: [AiService],
})
export class AiModule {}
