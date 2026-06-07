import { defineConfig } from 'prisma/config';

// Prisma 7+: connection URL moved out of schema.prisma.
// Used by `prisma migrate` and `prisma generate` CLI commands.
// The .env file in this directory is loaded automatically by the Prisma CLI.
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
