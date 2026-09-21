import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  errorResponseSchema,
  idParamsSchema,
  notFoundResponses,
} from '../../common/schemas/index.js'
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  taskSchema,
  taskStatsSchema,
  updateTaskBodySchema,
} from './tasks.schemas.js'
import type { TasksService } from './tasks.service.js'

const tags = ['Tasks']

/** HTTP layer: validates the request, calls the service, shapes the response. */
export const tasksRoutes =
  (service: TasksService): FastifyPluginAsyncZod =>
  async (app) => {
    app.get(
      '',
      {
        schema: {
          tags,
          summary: 'List tasks',
          description: 'Search, filter and sort are done by the database.',
          querystring: listTasksQuerySchema,
          response: { 200: z.array(taskSchema), 400: errorResponseSchema },
        },
      },
      (request) => service.list(request.query),
    )

    app.get(
      '/stats',
      {
        schema: {
          tags,
          summary: 'Task counters',
          description: 'Counts over all tasks, independent of any filter.',
          response: { 200: taskStatsSchema },
        },
      },
      () => service.stats(),
    )

    app.get(
      '/:id',
      {
        schema: {
          tags,
          summary: 'Get a task',
          params: idParamsSchema,
          response: { 200: taskSchema, ...notFoundResponses },
        },
      },
      (request) => service.get(request.params.id),
    )

    app.post(
      '',
      {
        schema: {
          tags,
          summary: 'Create a task',
          description: 'A new task is always not completed.',
          body: createTaskBodySchema,
          response: { 201: taskSchema, 400: errorResponseSchema },
        },
      },
      async (request, reply) => reply.code(201).send(await service.create(request.body)),
    )

    app.patch(
      '/:id',
      {
        schema: {
          tags,
          summary: 'Update a task',
          description: 'Only the given fields change. `null` clears `description` and `dueDate`.',
          params: idParamsSchema,
          body: updateTaskBodySchema,
          response: { 200: taskSchema, ...notFoundResponses },
        },
      },
      (request) => service.update(request.params.id, request.body),
    )

    app.delete(
      '/:id',
      {
        schema: {
          tags,
          summary: 'Delete a task',
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
