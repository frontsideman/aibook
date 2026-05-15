import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChildProfileService } from './child-profile/child-profile.service';
import { ChildProfileController } from './child-profile/child-profile.controller';

@Module({
  imports: [],
  controllers: [ChildProfileController],
  providers: [PrismaService, ChildProfileService],
  exports: [PrismaService],
})
export class AppModule {}
