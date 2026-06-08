import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as db from '@prisma/client';
import { fetch, Headers, Request, Response } from 'undici';

// Polyfill fetch for Prisma driver adapters if not available
if (!global.fetch) {
  // @ts-ignore
  global.fetch = fetch;
  // @ts-ignore
  global.Headers = Headers;
  // @ts-ignore
  global.Request = Request;
  // @ts-ignore
  global.Response = Response;
}

export function createPrismaClient(connectionString?: string) {
  const url =
    connectionString || process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new db.PrismaClient({ adapter });
}

export const prisma = createPrismaClient();

// Export all Prisma types
export * from '@prisma/client';
