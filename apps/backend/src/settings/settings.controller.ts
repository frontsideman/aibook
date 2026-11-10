import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReasoningEffort } from '@repo/database';
import { MockAuthGuard } from '../mock-auth.guard';
import { SettingsService } from './settings.service';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string };
}

export class UpdateGenerationSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  llmModel?: string;

  @IsEnum(ReasoningEffort)
  reasoningEffort!: ReasoningEffort;
}

@Controller('settings')
@UseGuards(MockAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('generation')
  getGenerationSettings(@Req() req: AuthenticatedRequest) {
    return this.settingsService.getGenerationSettings(req.user.id);
  }

  @Patch('generation')
  updateGenerationSettings(
    @Body() body: UpdateGenerationSettingsDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.settingsService.updateGenerationSettings(req.user.id, body);
  }
}
