import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { ReasoningEffort } from '@repo/database';
import { getAvailableLlmModels } from '../ai/llm.config';

const DEFAULT_REASONING_EFFORT = ReasoningEffort.MEDIUM;

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

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

    const availableModels = this.getAvailableModels();
    const activeModel = this.resolveModel(user.preferredLlmModel, availableModels);

    return {
      llmModel: activeModel,
      reasoningEffort: user.preferredReasoningEffort ?? DEFAULT_REASONING_EFFORT,
      availableModels,
    };
  }

  async updateGenerationSettings(
    userId: string,
    input: { llmModel?: string; reasoningEffort: ReasoningEffort }
  ) {
    this.validateReasoningEffort(input.reasoningEffort);

    const availableModels = this.getAvailableModels();
    const requestedModel = input.llmModel?.trim();
    if (requestedModel) {
      this.validateLlmModel(requestedModel, availableModels);
    }

    let user;
    try {
      user = await this.prisma.client.user.update({
        where: { id: userId },
        data: {
          preferredReasoningEffort: input.reasoningEffort,
          ...(requestedModel ? { preferredLlmModel: requestedModel } : {}),
        },
        select: {
          preferredLlmModel: true,
          preferredReasoningEffort: true,
        },
      });
    } catch (error: unknown) {
      const prismaError = error as { code?: string } | null;
      if (prismaError?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      throw error;
    }

    return {
      llmModel: this.resolveModel(user.preferredLlmModel, availableModels),
      reasoningEffort: user.preferredReasoningEffort,
      availableModels,
    };
  }

  private getAvailableModels() {
    return getAvailableLlmModels(this.configService);
  }

  private resolveModel(preferredModel: string | null, availableModels: string[]) {
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }

    return availableModels[0];
  }

  private validateLlmModel(llmModel: string, availableModels: string[]) {
    if (!availableModels.includes(llmModel)) {
      throw new BadRequestException(
        `Invalid llmModel. Available models: ${availableModels.join(', ')}`
      );
    }
  }

  private validateReasoningEffort(reasoningEffort: ReasoningEffort) {
    if (!Object.values(ReasoningEffort).includes(reasoningEffort)) {
      throw new BadRequestException('Invalid reasoningEffort');
    }
  }
}
