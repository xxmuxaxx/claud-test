import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerErrorHandling } from '../src/common/errors/errorHandler.js'
import { request, useTestApp } from './helpers.js'

const ctx = useTestApp()

describe('GET /api/v1/health', () => {
  it('reports ok', async () => {
    const res = await request(ctx.app, 'GET', '/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('CORS', () => {
  const preflight = (origin: string) =>
    ctx.app.inject({
      method: 'OPTIONS',
      url: '/api/v1/tasks/some-id',
      headers: { origin, 'access-control-request-method': 'PATCH' },
    })

  it('allows the configured frontend origin', async () => {
    const res = await preflight('http://localhost:5173')

    expect(res.statusCode).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(res.headers['access-control-allow-methods']).toContain('PATCH')
  })

  it('does not allow other origins', async () => {
    const res = await preflight('http://evil.example')
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('adds the header to normal responses', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: { origin: 'http://localhost:5173' },
    })
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})

describe('OpenAPI', () => {
  it('serves the spec with every endpoint documented', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/docs/json' })
    const spec = res.json()

    expect(res.statusCode).toBe(200)
    expect(Object.keys(spec.paths).sort()).toEqual([
      '/api/v1/articles',
      '/api/v1/articles/stats',
      '/api/v1/articles/{id}',
      '/api/v1/articles/{id}/related',
      '/api/v1/health',
      '/api/v1/tags',
      '/api/v1/tasks',
      '/api/v1/tasks/stats',
      '/api/v1/tasks/{id}',
    ])

    const listTasks = spec.paths['/api/v1/tasks'].get
    expect(listTasks.parameters.map((p: { name: string }) => p.name)).toEqual(
      expect.arrayContaining(['search', 'status', 'priority', 'sort', 'order']),
    )
    expect(spec.paths['/api/v1/tasks'].post.requestBody).toBeDefined()
    expect(spec.paths['/api/v1/tasks/{id}'].get.responses['404']).toBeDefined()
    expect(spec.paths['/api/v1/articles'].post.responses['201']).toBeDefined()
  })

  it('serves the Swagger UI', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/docs/' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
  })
})

describe('error format', () => {
  it('unknown routes: 404 in the unified format', async () => {
    const res = await request(ctx.app, 'GET', '/nope')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route GET /api/v1/nope not found' },
    })
  })

  it('unsupported methods are 404 as well', async () => {
    const res = await request(ctx.app, 'DELETE', '/tasks')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND')
  })

  /** A separate instance: the routes throw whatever the database layer could throw. */
  async function appThrowing(error: Error) {
    const app = Fastify({ logger: false })
    registerErrorHandling(app)
    app.get('/boom', () => {
      throw error
    })
    return app
  }

  const prismaError = (code: string) =>
    new PrismaClientKnownRequestError('db failure', { code, clientVersion: 'test' })

  it('409 for a unique-constraint violation', async () => {
    const res = await (await appThrowing(prismaError('P2002'))).inject('/boom')

    expect(res.statusCode).toBe(409)
    expect(res.json()).toEqual({ error: { code: 'CONFLICT', message: 'Resource already exists' } })
  })

  it('404 when the database reports a missing record', async () => {
    const res = await (await appThrowing(prismaError('P2025'))).inject('/boom')

    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('NOT_FOUND')
  })

  it('500 without leaking internals for anything unexpected', async () => {
    const res = await (
      await appThrowing(new Error('connection string postgres://secret'))
    ).inject('/boom')

    expect(res.statusCode).toBe(500)
    expect(res.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    })
    expect(res.body).not.toContain('secret')
  })
})

describe('trailing slash', () => {
  it('is ignored', async () => {
    expect((await request(ctx.app, 'GET', '/tasks/')).status).toBe(200)
    expect((await request(ctx.app, 'GET', '/health/')).status).toBe(200)
  })
})
