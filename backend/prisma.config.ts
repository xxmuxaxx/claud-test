import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/database/seed.ts',
  },
  datasource: {
    // Not `env()`: `prisma generate` (e.g. in the Docker build) must work without a database.
    url: process.env.DATABASE_URL ?? '',
  },
})
