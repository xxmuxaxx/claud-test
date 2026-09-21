import { describe, expect, it } from 'vitest'
import { backend } from '@/test/fakeBackend'
import { articlesApi } from './articlesApi'
import { API_BASE_URL, ApiError, apiRequest } from './http'
import { tagsApi } from './tagsApi'
import { tasksApi } from './tasksApi'

/** The last request the fake backend received, with its JSON body. */
function lastRequest() {
  const [input, init] = backend.fetch.mock.calls.at(-1)!
  return {
    url: String(input),
    method: init?.method,
    body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    headers: init?.headers,
  }
}

describe('http', () => {
  it('talks to the versioned API base URL', () => {
    expect(API_BASE_URL).toBe('http://localhost:3000/api/v1')
  })

  it('leaves out empty query parameters', async () => {
    await apiRequest('GET', '/tasks', { query: { search: '', status: undefined, sort: 'title' } })
    expect(lastRequest().url).toBe(`${API_BASE_URL}/tasks?sort=title`)
  })

  it('turns the unified error format into an ApiError', async () => {
    const error = await apiRequest('GET', '/tasks/nope').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 404,
      code: 'TASK_NOT_FOUND',
      message: 'Task not found',
      isNetworkError: false,
    })
  })

  it('turns a network failure into an ApiError with status 0', async () => {
    backend.offline = true
    const error = await apiRequest('GET', '/tasks').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR', isNetworkError: true })
  })

  it('copes with an error response that is not JSON', async () => {
    backend.fetch.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))
    await expect(apiRequest('GET', '/tasks')).rejects.toMatchObject({
      status: 502,
      code: 'HTTP_ERROR',
    })
  })
})

describe('tasksApi', () => {
  it('maps the backend shape to the frontend Task (null due date -> undefined)', async () => {
    backend.seedTasks([{ id: 't', title: 'Задача', completed: false, priority: 'low' }])

    const [task] = await tasksApi.list()

    expect(task).toEqual({
      id: 't',
      title: 'Задача',
      description: undefined,
      completed: false,
      priority: 'low',
      dueDate: undefined,
    })
    expect(task).not.toHaveProperty('createdAt')
  })

  it('creates with the form input and a JSON body', async () => {
    await tasksApi.create({ title: 'Задача', priority: 'high', dueDate: '2030-05-20' })

    expect(lastRequest()).toMatchObject({
      method: 'POST',
      url: `${API_BASE_URL}/tasks`,
      body: { title: 'Задача', priority: 'high', dueDate: '2030-05-20' },
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('sends only what changed when updating', async () => {
    backend.seedTasks([{ id: 't', title: 'Задача', completed: false, priority: 'low' }])

    await tasksApi.update('t', { completed: true })

    expect(lastRequest()).toMatchObject({
      method: 'PATCH',
      url: `${API_BASE_URL}/tasks/t`,
      body: { completed: true },
    })
  })

  it('clears optional fields by sending null for keys that are present but undefined', async () => {
    backend.seedTasks([
      { id: 't', title: 'Задача', description: 'Текст', completed: false, priority: 'low' },
    ])

    await tasksApi.update('t', { title: 'Новое', description: undefined, dueDate: undefined })

    expect(lastRequest().body).toEqual({ title: 'Новое', description: null, dueDate: null })
  })

  it('escapes ids in the path and deletes with 204', async () => {
    backend.seedTasks([{ id: 'a/b', title: 'Задача', completed: false, priority: 'low' }])

    await expect(tasksApi.remove('a/b')).resolves.toBeUndefined()

    expect(lastRequest()).toMatchObject({ method: 'DELETE', url: `${API_BASE_URL}/tasks/a%2Fb` })
    expect(backend.tasks).toHaveLength(0)
  })
})

describe('articlesApi', () => {
  const article = {
    id: 'a',
    title: 'React',
    content: '# React',
    tags: ['react'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  it('passes search and tag to the backend', async () => {
    backend.seedArticles([article])

    await articlesApi.list({ search: 'rea', tag: 'react' })

    expect(lastRequest().url).toBe(`${API_BASE_URL}/articles?search=rea&tag=react`)
  })

  it('resolves null for an unknown article and rethrows other errors', async () => {
    await expect(articlesApi.get('missing')).resolves.toBeNull()

    backend.offline = true
    await expect(articlesApi.get('missing')).rejects.toBeInstanceOf(ApiError)
  })

  it('sends a cleared description as null and returns the stored article', async () => {
    backend.seedArticles([{ ...article, description: 'Старое' }])

    const updated = await articlesApi.update('a', { title: 'React', content: '', tags: [] })

    expect(lastRequest().body).toEqual({ title: 'React', content: '', tags: [], description: null })
    expect(updated.description).toBeUndefined()
  })

  it('fetches related articles and stats', async () => {
    backend.seedArticles([article, { ...article, id: 'b', title: 'Vue' }])

    expect((await articlesApi.related('a')).map((item) => item.id)).toEqual(['b'])
    expect(await articlesApi.stats()).toEqual({ total: 2 })
  })
})

describe('tagsApi', () => {
  it('maps name/articleCount to tag/count', async () => {
    backend.seedArticles([
      { id: 'a', title: 'A', content: '', tags: ['x'], createdAt: '', updatedAt: '' },
    ])

    expect(await tagsApi.list()).toEqual([{ tag: 'x', count: 1 }])
  })
})
