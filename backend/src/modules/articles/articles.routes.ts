import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  errorResponseSchema,
  idParamsSchema,
  notFoundResponses,
} from '../../common/schemas/index.js'
import {
  articleSchema,
  articleStatsSchema,
  createArticleBodySchema,
  listArticlesQuerySchema,
  relatedQuerySchema,
  updateArticleBodySchema,
} from './articles.schemas.js'
import type { ArticlesService } from './articles.service.js'

const tags = ['Articles']

/** HTTP layer: validates the request, calls the service, shapes the response. */
export const articlesRoutes =
  (service: ArticlesService): FastifyPluginAsyncZod =>
  async (app) => {
    app.get(
      '',
      {
        schema: {
          tags,
          summary: 'List articles',
          description: 'Search, tag filter and sort are done by the database.',
          querystring: listArticlesQuerySchema,
          response: { 200: z.array(articleSchema), 400: errorResponseSchema },
        },
      },
      (request) => service.list(request.query),
    )

    app.get(
      '/stats',
      {
        schema: {
          tags,
          summary: 'Article counters',
          description: 'Counts over all articles, independent of any filter.',
          response: { 200: articleStatsSchema },
        },
      },
      () => service.stats(),
    )

    app.get(
      '/:id',
      {
        schema: {
          tags,
          summary: 'Get an article',
          params: idParamsSchema,
          response: { 200: articleSchema, ...notFoundResponses },
        },
      },
      (request) => service.get(request.params.id),
    )

    app.get(
      '/:id/related',
      {
        schema: {
          tags,
          summary: 'Related articles',
          description: 'Articles sharing tags with this one: most shared tags first.',
          params: idParamsSchema,
          querystring: relatedQuerySchema,
          response: { 200: z.array(articleSchema), ...notFoundResponses },
        },
      },
      (request) => service.related(request.params.id, request.query.limit),
    )

    app.post(
      '',
      {
        schema: {
          tags,
          summary: 'Create an article',
          body: createArticleBodySchema,
          response: { 201: articleSchema, 400: errorResponseSchema, 409: errorResponseSchema },
        },
      },
      async (request, reply) => reply.code(201).send(await service.create(request.body)),
    )

    app.patch(
      '/:id',
      {
        schema: {
          tags,
          summary: 'Update an article',
          description:
            'Only the given fields change. `tags`, when given, replaces the whole tag list.',
          params: idParamsSchema,
          body: updateArticleBodySchema,
          response: { 200: articleSchema, 409: errorResponseSchema, ...notFoundResponses },
        },
      },
      (request) => service.update(request.params.id, request.body),
    )

    app.delete(
      '/:id',
      {
        schema: {
          tags,
          summary: 'Delete an article',
          params: idParamsSchema,
          response: { 204: z.null().describe('Deleted'), ...notFoundResponses },
        },
      },
      async (request, reply) => {
        await service.remove(request.params.id)
        return reply.code(204).send(null)
      },
    )
  }
