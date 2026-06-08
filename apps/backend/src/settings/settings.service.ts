import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReasoningEffort } from '@repo/database';
import { PrismaService } from '../prisma.service';

const DEFAULT_REASONING_EFFORT = ReasoningEffort.MEDIUM;

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getGenerationSettings(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        preferredReasoningEffort: true,
        preferredLlmModel: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      llmModel: user.preferredLlmModel || this.getActiveLlmModel(),
      reasoningEffort: user.preferredReasoningEffort ?? DEFAULT_REASONING_EFFORT,
    };
  }

  async updateGenerationSettings(userId: string, input: { llmModel?: string; reasoningEffort: ReasoningEffort }) {
    this.validateReasoningEffort(input.reasoningEffort);

    let user;
    try {
      user = await this.prisma.client.user.update({
        where: { id: userId },
        data: {
          preferredReasoningEffort: input.reasoningEffort,
          ...(input.llmModel ? { preferredLlmModel: input.llmModel } : {}),
        },
        select: {
          preferredReasoningEffort: true,
          preferredLlmModel: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      throw error;
    }

    return {
      llmModel: user.preferredLlmModel || this.getActiveLlmModel(),
      reasoningEffort: user.preferredReasoningEffort,
    };
  }

  private getActiveLlmModel() {
    return this.configService.getOrThrow<string>('LLM_MODEL_NAME');
  }

  private validateReasoningEffort(reasoningEffort: ReasoningEffort) {
    if (!Object.values(ReasoningEffort).includes(reasoningEffort)) {
      throw new BadRequestException('Invalid reasoningEffort');
    }
  }
}
