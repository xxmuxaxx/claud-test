import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { TagsService } from './tags.service.js'

const tagSchema = z.object({
  name: z.string().describe('Normalized: lowercase, no `#`'),
  articleCount: z.number().int().describe('How many articles carry the tag'),
})

export const tagsRoutes =
  (service: TagsService): FastifyPluginAsyncZod =>
  async (app) => {
    app.get(
      '',
      {
        schema: {
          tags: ['Tags'],
          summary: 'List used tags',
          description:
            'Tags are derived from the existing articles: a tag nobody uses is not listed. ' +
            'Most used first. Filter articles with `GET /articles?tag=<name>`.',
          response: { 200: z.array(tagSchema) },
        },
      },
      () => service.list(),
    )
  }
