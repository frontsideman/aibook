import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChildProfileService } from './child-profile/child-profile.service';
import { ChildProfileController } from './child-profile/child-profile.controller';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ChildProfileController],
  providers: [PrismaService, ChildProfileService],
  exports: [PrismaService],
})
export class AppModule {}
