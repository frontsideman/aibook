const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const db = require("@prisma/client");

// Polyfill fetch for Prisma driver adapters
if (!global.fetch) {
  const { fetch, Headers, Request, Response } = require('undici');
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

function createPrismaClient(connectionString) {
  const url = connectionString || process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new db.PrismaClient({ adapter });
}

const prisma = createPrismaClient();

module.exports = {
  prisma,
  createPrismaClient,
  ...db,
};
