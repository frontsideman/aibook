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
  const pool = new Pool({ connectionString: connectionString || process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new db.PrismaClient({ adapter });
}

// For compatibility with current usage, but we should move to createPrismaClient
let prisma;
try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy' });
  const adapter = new PrismaPg(pool);
  prisma = new db.PrismaClient({ adapter });
} catch (e) {
  console.warn('Failed to initialize default prisma instance, likely in test environment');
}

module.exports = {
  prisma,
  createPrismaClient,
  ...db,
};
