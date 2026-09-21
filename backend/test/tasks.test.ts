import { describe, expect, it } from 'vitest'
import { request, useTestApp } from './helpers.js'

const ctx = useTestApp()

const create = (body: Record<string, unknown>) => request(ctx.app, 'POST', '/tasks', body)
const titles = (body: { title: string }[]) => body.map((task) => task.title)

async function seed() {
  await create({
    title: 'Изучить React',
    description: 'Разобраться с hooks',
    priority: 'high',
    dueDate: '2026-09-25',
  })
  await create({ title: 'Купить молоко', priority: 'low' })
  await create({
    title: 'Написать отчёт',
    description: 'Квартальный react-отчёт',
    priority: 'medium',
    dueDate: '2026-09-20',
  })
  const done = await create({ title: 'Позвонить маме', priority: 'medium', dueDate: '2026-10-01' })
  await request(ctx.app, 'PATCH', `/tasks/${done.body.id}`, { completed: true })
}

describe('POST /tasks', () => {
  it('creates a task: not completed, with an id and timestamps', async () => {
    const res = await create({
      title: 'Изучить React',
      description: 'Разобраться с React hooks',
      priority: 'high',
      dueDate: '2026-09-25',
    })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: expect.any(String),
      title: 'Изучить React',
      description: 'Разобраться с React hooks',
      completed: false,
      priority: 'high',
      dueDate: '2026-09-25',
      createdAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT.*Z$/),
      updatedAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT.*Z$/),
    })
  })

  it('applies defaults: medium priority, no description, no due date', async () => {
    const res = await create({ title: '  Просто задача  ' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ title: 'Просто задача', priority: 'medium', dueDate: null })
    expect(res.body).not.toHaveProperty('description')
  })

  it('ignores a client-sent `completed`: new tasks are never completed', async () => {
    const res = await create({ title: 'Задача', completed: true })
    expect(res.body.completed).toBe(false)
  })
})

describe('GET /tasks/:id', () => {
  it('returns the task', async () => {
    const created = await create({ title: 'Задача' })
    const res = await request(ctx.app, 'GET', `/tasks/${created.body.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(created.body)
  })

  it('404 with the unified error format for an unknown id', async () => {
    const res = await request(ctx.app, 'GET', '/tasks/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } })
  })
})

describe('PATCH /tasks/:id', () => {
  it('changes only the given fields and bumps updatedAt', async () => {
    const created = await create({ title: 'Старое', description: 'Описание', priority: 'low' })
    await new Promise((resolve) => setTimeout(resolve, 10))

    const res = await request(ctx.app, 'PATCH', `/tasks/${created.body.id}`, {
      title: 'Новое',
      completed: true,
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: created.body.id,
      title: 'Новое',
      description: 'Описание',
      priority: 'low',
      completed: true,
      createdAt: created.body.createdAt,
    })
    expect(res.body.updatedAt > created.body.updatedAt).toBe(true)
  })

  it('null (or an empty string) clears description and dueDate', async () => {
    const created = await create({ title: 'Задача', description: 'Текст', dueDate: '2026-09-25' })

    const res = await request(ctx.app, 'PATCH', `/tasks/${created.body.id}`, {
      description: '',
      dueDate: null,
    })

    expect(res.status).toBe(200)
    expect(res.body.dueDate).toBeNull()
    expect(res.body).not.toHaveProperty('description')
  })

  it('persists the change', async () => {
    const created = await create({ title: 'Задача' })
    await request(ctx.app, 'PATCH', `/tasks/${created.body.id}`, { priority: 'high' })

    const res = await request(ctx.app, 'GET', `/tasks/${created.body.id}`)
    expect(res.body.priority).toBe('high')
  })

  it('404 for an unknown id', async () => {
    const res = await request(ctx.app, 'PATCH', '/tasks/nope', { title: 'X' })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('TASK_NOT_FOUND')
  })
})

describe('DELETE /tasks/:id', () => {
  it('deletes the task: 204 without a body, then 404', async () => {
    const created = await create({ title: 'Задача' })

    const res = await request(ctx.app, 'DELETE', `/tasks/${created.body.id}`)
    expect(res.status).toBe(204)
    expect(res.body).toBeUndefined()

    expect((await request(ctx.app, 'GET', `/tasks/${created.body.id}`)).status).toBe(404)
    expect((await request(ctx.app, 'GET', '/tasks')).body).toEqual([])
  })

  it('404 for an unknown id', async () => {
    const res = await request(ctx.app, 'DELETE', '/tasks/nope')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('TASK_NOT_FOUND')
  })
})

describe('GET /tasks — search', () => {
  it('finds by title and by description, case-insensitively', async () => {
    await seed()

    expect(titles((await request(ctx.app, 'GET', '/tasks?search=МОЛОКО')).body)).toEqual([
      'Купить молоко',
    ])
    // "react" is in a title and in a description of two different tasks.
    const res = await request(ctx.app, 'GET', '/tasks?search=react&sort=title')
    expect(titles(res.body)).toEqual(['Изучить React', 'Написать отчёт'])
  })

  it('requires every word to match, in any field', async () => {
    await seed()

    const res = await request(ctx.app, 'GET', `/tasks?search=${encodeURIComponent('react hooks')}`)
    expect(titles(res.body)).toEqual(['Изучить React'])
  })

  it('treats % and _ literally', async () => {
    await create({ title: 'Скидка 100% на всё' })
    await create({ title: 'Скидка 1000 на всё' })
    await create({ title: 'snake_case' })
    await create({ title: 'snakeXcase' })

    expect(titles((await request(ctx.app, 'GET', '/tasks?search=100%25')).body)).toEqual([
      'Скидка 100% на всё',
    ])
    expect(titles((await request(ctx.app, 'GET', '/tasks?search=snake_case')).body)).toEqual([
      'snake_case',
    ])
  })

  it('an empty search returns everything', async () => {
    await seed()
    expect((await request(ctx.app, 'GET', '/tasks?search=%20')).body).toHaveLength(4)
  })
})

describe('GET /tasks — filters', () => {
  it('filters by status', async () => {
    await seed()

    const active = await request(ctx.app, 'GET', '/tasks?status=active')
    const completed = await request(ctx.app, 'GET', '/tasks?status=completed')
    const all = await request(ctx.app, 'GET', '/tasks?status=all')

    expect(active.body).toHaveLength(3)
    expect(active.body.every((task: { completed: boolean }) => !task.completed)).toBe(true)
    expect(titles(completed.body)).toEqual(['Позвонить маме'])
    expect(all.body).toHaveLength(4)
  })

  it('filters by priority', async () => {
    await seed()

    const res = await request(ctx.app, 'GET', '/tasks?priority=medium&sort=title')
    expect(titles(res.body)).toEqual(['Написать отчёт', 'Позвонить маме'])
  })

  it('combines status, priority and search', async () => {
    await seed()

    const res = await request(ctx.app, 'GET', '/tasks?status=active&priority=high')
    expect(titles(res.body)).toEqual(['Изучить React'])

    const none = await request(ctx.app, 'GET', '/tasks?status=completed&priority=high')
    expect(none.body).toEqual([])

    const combined = await request(
      ctx.app,
      'GET',
      '/tasks?status=active&priority=medium&search=react',
    )
    expect(titles(combined.body)).toEqual(['Написать отчёт'])
  })
})

describe('GET /tasks — sorting', () => {
  it('sorts by createdAt, newest first by default', async () => {
    await create({ title: 'Первая' })
    await create({ title: 'Вторая' })
    await create({ title: 'Третья' })

    expect(titles((await request(ctx.app, 'GET', '/tasks')).body)).toEqual([
      'Третья',
      'Вторая',
      'Первая',
    ])
    expect(titles((await request(ctx.app, 'GET', '/tasks?sort=createdAt&order=asc')).body)).toEqual(
      ['Первая', 'Вторая', 'Третья'],
    )
  })

  it('sorts by updatedAt', async () => {
    const first = await create({ title: 'Первая' })
    await create({ title: 'Вторая' })
    await request(ctx.app, 'PATCH', `/tasks/${first.body.id}`, { completed: true })

    expect(
      titles((await request(ctx.app, 'GET', '/tasks?sort=updatedAt&order=desc')).body),
    ).toEqual(['Первая', 'Вторая'])
  })

  it('sorts by title, ascending by default', async () => {
    await create({ title: 'B task' })
    await create({ title: 'C task' })
    await create({ title: 'A task' })

    expect(titles((await request(ctx.app, 'GET', '/tasks?sort=title')).body)).toEqual([
      'A task',
      'B task',
      'C task',
    ])
    expect(titles((await request(ctx.app, 'GET', '/tasks?sort=title&order=desc')).body)).toEqual([
      'C task',
      'B task',
      'A task',
    ])
  })

  it('sorts by priority (high > medium > low), highest first by default', async () => {
    await create({ title: 'low', priority: 'low' })
    await create({ title: 'high', priority: 'high' })
    await create({ title: 'medium', priority: 'medium' })

    expect(titles((await request(ctx.app, 'GET', '/tasks?sort=priority')).body)).toEqual([
      'high',
      'medium',
      'low',
    ])
    expect(titles((await request(ctx.app, 'GET', '/tasks?sort=priority&order=asc')).body)).toEqual([
      'low',
      'medium',
      'high',
    ])
  })

  it('sorts by dueDate: soonest first, tasks without a date always last', async () => {
    await create({ title: 'no date' })
    await create({ title: 'later', dueDate: '2026-12-01' })
    await create({ title: 'sooner', dueDate: '2026-09-01' })

    expect(titles((await request(ctx.app, 'GET', '/tasks?sort=dueDate')).body)).toEqual([
      'sooner',
      'later',
      'no date',
    ])
    expect(titles((await request(ctx.app, 'GET', '/tasks?sort=dueDate&order=desc')).body)).toEqual([
      'later',
      'sooner',
      'no date',
    ])
  })
})

describe('GET /tasks/stats', () => {
  it('counts all tasks regardless of filters', async () => {
    expect((await request(ctx.app, 'GET', '/tasks/stats')).body).toEqual({
      total: 0,
      active: 0,
      completed: 0,
    })

    await seed()
    expect((await request(ctx.app, 'GET', '/tasks/stats?status=completed')).body).toEqual({
      total: 4,
      active: 3,
      completed: 1,
    })
  })
})

describe('validation', () => {
  const invalid = async (body: unknown) => {
    const res = await request(ctx.app, 'POST', '/tasks', body)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.message).toEqual(expect.any(String))
    return res.body.error.details as { path: string; message: string }[]
  }

  it('requires a title', async () => {
    expect((await invalid({})).map((d) => d.path)).toContain('title')
  })

  it('rejects an empty or blank title', async () => {
    await invalid({ title: '' })
    await invalid({ title: '   ' })
  })

  it('rejects a title that is not a string', async () => {
    await invalid({ title: 42 })
  })

  it('limits the title to 200 characters', async () => {
    await invalid({ title: 'x'.repeat(201) })
    expect((await create({ title: 'x'.repeat(200) })).status).toBe(201)
  })

  it('limits the description to 2000 characters', async () => {
    expect(
      (await invalid({ title: 'A', description: 'x'.repeat(2001) })).map((d) => d.path),
    ).toEqual(['description'])
    expect((await create({ title: 'A', description: 'x'.repeat(2000) })).status).toBe(201)
  })

  it('accepts only known priorities', async () => {
    await invalid({ title: 'A', priority: 'urgent' })
  })

  it('accepts only valid calendar dates (or null) as dueDate', async () => {
    await invalid({ title: 'A', dueDate: 'tomorrow' })
    await invalid({ title: 'A', dueDate: '2026-02-30' })
    await invalid({ title: 'A', dueDate: '25.09.2026' })
    expect((await create({ title: 'A', dueDate: null })).status).toBe(201)
  })

  it('validates PATCH bodies too, and rejects an empty one', async () => {
    const created = await create({ title: 'Задача' })
    const patch = (body: unknown) => request(ctx.app, 'PATCH', `/tasks/${created.body.id}`, body)

    expect((await patch({ title: '' })).status).toBe(400)
    expect((await patch({ priority: 'nope' })).status).toBe(400)
    expect((await patch({ completed: 'yes' })).status).toBe(400)
    expect((await patch({})).status).toBe(400)
  })

  it('validates the query string', async () => {
    for (const query of ['status=done', 'priority=urgent', 'sort=color', 'order=up']) {
      const res = await request(ctx.app, 'GET', `/tasks?${query}`)
      expect(res.status, query).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('reports malformed JSON in the unified format', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { 'content-type': 'application/json' },
      payload: '{"title": ',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('BAD_REQUEST')
  })
})
