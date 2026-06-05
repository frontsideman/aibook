import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReasoningEffort } from '@repo/database';
import { PrismaService } from '../prisma.service';

const DEFAULT_LLM_MODEL = 'openai:gpt-5.4-mini';
const DEFAULT_REASONING_EFFORT = ReasoningEffort.MEDIUM;
const LLM_MODEL_PATTERN = /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9.-]*$/i;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGenerationSettings(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        preferredLlmModel: true,
        preferredReasoningEffort: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      llmModel: user.preferredLlmModel ?? DEFAULT_LLM_MODEL,
      reasoningEffort: user.preferredReasoningEffort ?? DEFAULT_REASONING_EFFORT,
    };
  }

  async updateGenerationSettings(
    userId: string,
    input: { llmModel: string; reasoningEffort: ReasoningEffort },
  ) {
    this.validateGenerationSettings(input);

    let user;
    try {
      user = await this.prisma.client.user.update({
        where: { id: userId },
        data: {
          preferredLlmModel: input.llmModel.trim(),
          preferredReasoningEffort: input.reasoningEffort,
        },
        select: {
          preferredLlmModel: true,
          preferredReasoningEffort: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      throw error;
    }

    return {
      llmModel: user.preferredLlmModel,
      reasoningEffort: user.preferredReasoningEffort,
    };
  }

  private validateGenerationSettings(input: {
    llmModel: string;
    reasoningEffort: ReasoningEffort;
  }) {
    if (typeof input.llmModel !== 'string' || !LLM_MODEL_PATTERN.test(input.llmModel.trim())) {
      throw new BadRequestException('Invalid llmModel');
    }

    if (!Object.values(ReasoningEffort).includes(input.reasoningEffort)) {
      throw new BadRequestException('Invalid reasoningEffort');
    }
  }
}
