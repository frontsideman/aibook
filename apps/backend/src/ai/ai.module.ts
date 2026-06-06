import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN } from './ai.provider.interface';
import { LlmGateway } from './llm.gateway';

@Module({
  providers: [
    AiService,
    {
      provide: AI_PROVIDER_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => new LlmGateway(configService),
    },
  ],
  exports: [AiService],
})
export class AiModule {}
