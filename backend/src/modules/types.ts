import type { FastifyPluginAsync } from 'fastify'
import type { PrismaClient } from '../database/prisma.js'

export interface ModuleOptions {
  prisma: PrismaClient
}

/**
 * A self-contained slice of the API. To add a section (calendar, notes, ...): create
 * `modules/<name>/` with its routes, service and repository, add its models to the Prisma
 * schema, and list it in `modules/index.ts`. Existing modules are not touched.
 */
export interface AppModule {
  name: string
  /** Mounted under `/api/v1`. */
  prefix: string
  plugin: FastifyPluginAsync<ModuleOptions>
}
