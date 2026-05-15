import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChildProfileService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    age: number;
    gender: string;
    interests: string;
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

  async findOne(id: string) {
    return this.prisma.client.childProfile.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    age: number;
    gender: string;
    interests: string;
  }>) {
    return this.prisma.client.childProfile.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.client.childProfile.delete({
      where: { id },
    });
  }
}
