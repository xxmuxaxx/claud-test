import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { AppModule } from '../types.js'

const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        response: { 200: z.object({ status: z.literal('ok') }) },
      },
    },
    () => ({ status: 'ok' as const }),
  )
}

export const healthModule: AppModule = {
  name: 'health',
  prefix: '/health',
  plugin: async (app) => {
    await app.register(healthRoutes)
  },
}
