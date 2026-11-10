import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChildProfileService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    age: number;
    gender: string;
    interests: string[];
    userId: string;
  }) {
    return this.prisma.client.childProfile.create({
      data,
    });
  }

  async findAll(userId: string) {
    return this.prisma.client.childProfile.findMany({
      where: { userId },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.client.childProfile.findFirst({
      where: { id, userId },
    });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      age: number;
      gender: string;
      interests: string[];
    }>
  ) {
    const existing = await this.prisma.client.childProfile.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Child profile not found');

    return this.prisma.client.childProfile.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.client.childProfile.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Child profile not found');

    return this.prisma.client.childProfile.delete({
      where: { id },
    });
  }
}
