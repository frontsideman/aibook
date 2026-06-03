import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StoryLibraryService {
  constructor(private prisma: PrismaService) {}

  async findAll({
    search,
    limit = 10,
    offset = 0,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 10;
    const safeOffset = Number.isFinite(offset) ? Math.max(offset, 0) : 0;

    return this.prisma.client.storyLibrary.findMany({
      where,
      orderBy: { title: 'asc' },
      take: safeLimit,
      skip: safeOffset,
    });
  }
}
