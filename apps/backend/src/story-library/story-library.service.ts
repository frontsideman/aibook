import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StoryLibraryService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};

    return this.prisma.client.storyLibrary.findMany({
      where,
      orderBy: { title: 'asc' },
      take: 20,
    });
  }
}
