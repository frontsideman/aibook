import { Injectable, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { createPrismaClient, type PrismaClient } from '@repo/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prismaClient: PrismaClient;

  constructor() {
    this.prismaClient = createPrismaClient(process.env.DATABASE_URL);
  }

  async onModuleInit() {
    await this.prismaClient.$connect();
  }

  async onModuleDestroy() {
    await this.prismaClient.$disconnect();
  }

  get client() {
    return this.prismaClient;
  }
}
