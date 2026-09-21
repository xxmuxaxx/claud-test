import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { Config } from './config/env.js'
import { registerErrorHandling } from './common/errors/errorHandler.js'
import type { PrismaClient } from './database/prisma.js'
import { modules } from './modules/index.js'

export const API_PREFIX = '/api/v1'
export const DOCS_PREFIX = '/api/docs'

export interface AppDependencies {
  config: Pick<Config, 'corsOrigins' | 'logLevel'>
  prisma: PrismaClient
}

/** Builds the app without listening, so tests can drive it with `app.inject()`. */
export async function buildApp({ config, prisma }: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel },
    routerOptions: { ignoreTrailingSlash: true },
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  registerErrorHandling(app)

  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Modern React App API',
        description: 'REST API of the To-Do and Wiki sections.',
        version: '1.0.0',
      },
      tags: [
        { name: 'Tasks', description: 'To-Do list' },
        { name: 'Articles', description: 'Wiki articles' },
        { name: 'Tags', description: 'Tags used by wiki articles' },
        { name: 'Health', description: 'Service status' },
      ],
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: DOCS_PREFIX })

  await app.register(
    async (v1) => {
      for (const module of modules) {
        await v1.register(module.plugin, { prefix: module.prefix, prisma })
      }
    },
    { prefix: API_PREFIX },
  )

  return app
}
