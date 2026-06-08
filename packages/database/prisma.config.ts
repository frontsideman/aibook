import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://dummy@localhost:5432/dummy',
  },
});
