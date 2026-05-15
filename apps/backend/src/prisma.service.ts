import { Injectable, OnModuleInit } from '@nestjs/common';
import { createPrismaClient } from '@repo/database';

@Injectable()
export class PrismaService implements OnModuleInit {
  private prismaClient: any;

  constructor() {
    this.prismaClient = createPrismaClient(process.env.DATABASE_URL);
  }

  async onModuleInit() {
    await this.prismaClient.$connect();
  }

  get client() {
    return this.prismaClient;
  }
}
