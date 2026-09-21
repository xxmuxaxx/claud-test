import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, inject } from 'vitest'
import { buildApp } from '../src/app.js'
import { createPrismaClient, type PrismaClient } from '../src/database/prisma.js'

export interface TestContext {
  app: FastifyInstance
  prisma: PrismaClient
}

/** Boots the app against the test database and empties every table before each test. */
export function useTestApp(): TestContext {
  const context = {} as TestContext

  beforeAll(async () => {
    context.prisma = createPrismaClient(inject('databaseUrl'))
    context.app = await buildApp({
      config: { corsOrigins: ['http://localhost:5173'], logLevel: 'silent' },
      prisma: context.prisma,
    })
    await context.app.ready()
  })

  beforeEach(async () => {
    await context.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "article_tags", "articles", "tags", "tasks" RESTART IDENTITY CASCADE',
    )
  })

  afterAll(async () => {
    await context.app.close()
    await context.prisma.$disconnect()
  })

  return context
}

export const API = '/api/v1'

/** Shorthand for `app.inject` that returns the parsed JSON body next to the status. */
export async function request(
  app: FastifyInstance,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  payload?: unknown,
) {
  const response = await app.inject({ method, url: `${API}${url}`, payload: payload as object })
  return {
    status: response.statusCode,
    body: response.body ? (JSON.parse(response.body) as any) : undefined,
    headers: response.headers,
  }
}
