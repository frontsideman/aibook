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

const connectionString = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new db.PrismaClient({ adapter });

module.exports = {
  prisma,
  ...db,
};
