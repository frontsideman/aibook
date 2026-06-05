import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ReasoningEffort } from '@repo/database';
import { MockAuthGuard } from '../mock-auth.guard';
import { SettingsService } from './settings.service';

export class UpdateGenerationSettingsDto {
  llmModel: string;
  reasoningEffort: ReasoningEffort;
}

@Controller('settings')
@UseGuards(MockAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('generation')
  getGenerationSettings(@Req() req: any) {
    return this.settingsService.getGenerationSettings(req.user.id);
  }

  @Patch('generation')
  updateGenerationSettings(@Body() body: UpdateGenerationSettingsDto, @Req() req: any) {
    return this.settingsService.updateGenerationSettings(req.user.id, body);
  }
}
