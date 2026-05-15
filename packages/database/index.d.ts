import { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
export const prisma: PrismaClient;
export function createPrismaClient(connectionString?: string): PrismaClient;
