import { describe, expect, it } from 'vitest'
import { request, useTestApp } from './helpers.js'

const ctx = useTestApp()

interface ArticleBody {
  id: string
  title: string
  tags: string[]
}

const create = (body: Record<string, unknown>) => request(ctx.app, 'POST', '/articles', body)
const list = async (query = '') =>
  (await request(ctx.app, 'GET', `/articles${query}`)).body as ArticleBody[]
const titles = (articles: ArticleBody[]) => articles.map((article) => article.title)

async function seed() {
  await create({
    title: 'React',
    description: 'Основы React',
    content: '# React\n\nБиблиотека для интерфейсов',
    tags: ['frontend', 'javascript', 'programming'],
  })
  await create({
    title: 'TypeScript',
    content: 'Типизация поверх JavaScript. Хорошо дружит с React.',
    tags: ['javascript', 'programming'],
  })
  await create({
    title: 'Docker',
    description: 'Контейнеры',
    content: 'docker compose up',
    tags: ['devops'],
  })
  await create({
    title: 'Git',
    content: 'Система контроля версий',
    tags: ['devops', 'programming'],
  })
}

describe('POST /articles', () => {
  it('creates an article with normalized tags', async () => {
    const res = await create({
      title: 'React',
      description: 'Основы React',
      content: '# React\n\nReact — библиотека...',
      tags: ['react', '#Frontend', ' React ', 'front end', '', '  '],
    })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: expect.any(String),
      title: 'React',
      description: 'Основы React',
      content: '# React\n\nReact — библиотека...',
      tags: ['react', 'frontend', 'front-end'],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  it('needs only a title and content; tags default to none, description is omitted', async () => {
    const res = await create({ title: 'Заметка', content: '' })

    expect(res.status).toBe(201)
    expect(res.body.tags).toEqual([])
    expect(res.body.content).toBe('')
    expect(res.body).not.toHaveProperty('description')
  })

  it('keeps the tags in the order the author gave them', async () => {
    const res = await create({ title: 'A', content: 'x', tags: ['zeta', 'alpha', 'mid'] })
    expect(res.body.tags).toEqual(['zeta', 'alpha', 'mid'])

    const fetched = await request(ctx.app, 'GET', `/articles/${res.body.id}`)
    expect(fetched.body.tags).toEqual(['zeta', 'alpha', 'mid'])
  })
})

describe('GET /articles/:id', () => {
  it('returns the article', async () => {
    const created = await create({ title: 'React', content: '# React', tags: ['react'] })
    const res = await request(ctx.app, 'GET', `/articles/${created.body.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(created.body)
  })

  it('404 with the unified error format for an unknown id', async () => {
    const res = await request(ctx.app, 'GET', '/articles/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' },
    })
  })
})

describe('PATCH /articles/:id', () => {
  it('updates fields, keeps id and createdAt, bumps updatedAt', async () => {
    const created = await create({
      title: 'React',
      description: 'Старое',
      content: 'старый текст',
      tags: ['react'],
    })
    await new Promise((resolve) => setTimeout(resolve, 10))

    const res = await request(ctx.app, 'PATCH', `/articles/${created.body.id}`, {
      title: 'React 19',
      content: 'новый текст',
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: created.body.id,
      title: 'React 19',
      description: 'Старое',
      content: 'новый текст',
      tags: ['react'],
      createdAt: created.body.createdAt,
    })
    expect(res.body.updatedAt > created.body.updatedAt).toBe(true)
  })

  it('replaces the whole tag list, normalizing it', async () => {
    const created = await create({ title: 'React', content: 'x', tags: ['react', 'frontend'] })

    const res = await request(ctx.app, 'PATCH', `/articles/${created.body.id}`, {
      tags: ['#Hooks', 'react'],
    })

    expect(res.body.tags).toEqual(['hooks', 'react'])
    expect((await request(ctx.app, 'GET', `/articles/${created.body.id}`)).body.tags).toEqual([
      'hooks',
      'react',
    ])
  })

  it('null clears the description; an empty tag list clears the tags', async () => {
    const created = await create({
      title: 'React',
      description: 'Текст',
      content: 'x',
      tags: ['a'],
    })

    const res = await request(ctx.app, 'PATCH', `/articles/${created.body.id}`, {
      description: null,
      tags: [],
    })

    expect(res.body).not.toHaveProperty('description')
    expect(res.body.tags).toEqual([])
  })

  it('404 for an unknown id', async () => {
    const res = await request(ctx.app, 'PATCH', '/articles/nope', { title: 'X' })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND')
  })
})

describe('DELETE /articles/:id', () => {
  it('deletes the article: 204 without a body, then 404', async () => {
    const created = await create({ title: 'React', content: 'x', tags: ['react'] })

    const res = await request(ctx.app, 'DELETE', `/articles/${created.body.id}`)
    expect(res.status).toBe(204)
    expect(res.body).toBeUndefined()

    expect((await request(ctx.app, 'GET', `/articles/${created.body.id}`)).status).toBe(404)
    expect(await list()).toEqual([])
  })

  it('404 for an unknown id', async () => {
    const res = await request(ctx.app, 'DELETE', '/articles/nope')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND')
  })
})

describe('GET /articles — search', () => {
  it('searches title, description, content and tags, case-insensitively', async () => {
    await seed()

    expect(titles(await list('?search=docker'))).toEqual(['Docker']) // title + content
    expect(titles(await list('?search=КОНТЕЙНЕРЫ'))).toEqual(['Docker']) // description
    expect(titles(await list('?search=версий'))).toEqual(['Git']) // content
    expect(titles(await list('?search=devops&sort=title'))).toEqual(['Docker', 'Git']) // tag
  })

  it('lets "#tag" find a tag', async () => {
    await seed()
    expect(titles(await list(`?search=${encodeURIComponent('#frontend')}`))).toEqual(['React'])
  })

  it('requires every word to match somewhere in the article', async () => {
    await seed()

    expect(titles(await list(`?search=${encodeURIComponent('react typescript')}`))).toEqual([
      'TypeScript',
    ])
    expect(await list(`?search=${encodeURIComponent('react docker')}`)).toEqual([])
  })

  it('ranks title matches above content matches when no sort is given', async () => {
    await seed()

    // "react" is in the title of "React" and only in the content of "TypeScript".
    expect(titles(await list('?search=react'))).toEqual(['React', 'TypeScript'])
  })

  it('treats % and _ literally', async () => {
    await create({ title: 'Проценты', content: 'Скидка 100% на всё' })
    await create({ title: 'Числа', content: 'Скидка 1000 на всё' })

    expect(titles(await list('?search=100%25'))).toEqual(['Проценты'])
  })
})

describe('GET /articles — tag filter', () => {
  it('filters by tag', async () => {
    await seed()

    expect(titles(await list('?tag=devops&sort=title'))).toEqual(['Docker', 'Git'])
    expect(titles(await list('?tag=frontend'))).toEqual(['React'])
    expect(await list('?tag=unknown')).toEqual([])
  })

  it('normalizes the tag in the query', async () => {
    await seed()
    expect(titles(await list(`?tag=${encodeURIComponent('#DevOps')}`)).sort()).toEqual([
      'Docker',
      'Git',
    ])
  })

  it('combines the tag filter with search', async () => {
    await seed()

    expect(titles(await list('?tag=programming&search=react&sort=title'))).toEqual([
      'React',
      'TypeScript',
    ])
    expect(titles(await list('?tag=devops&search=react'))).toEqual([])
  })

  it('returns the article with all of its tags, not only the filtered one', async () => {
    await seed()
    const [react] = await list('?tag=frontend')
    expect(react?.tags).toEqual(['frontend', 'javascript', 'programming'])
  })
})

describe('GET /articles — sorting', () => {
  it('sorts by createdAt', async () => {
    await create({ title: 'Первая', content: '' })
    await create({ title: 'Вторая', content: '' })
    await create({ title: 'Третья', content: '' })

    expect(titles(await list('?sort=createdAt&order=asc'))).toEqual(['Первая', 'Вторая', 'Третья'])
    expect(titles(await list('?sort=createdAt&order=desc'))).toEqual(['Третья', 'Вторая', 'Первая'])
    expect(titles(await list('?sort=createdAt'))).toEqual(['Третья', 'Вторая', 'Первая'])
  })

  it('sorts by updatedAt; the default order is most recently updated first', async () => {
    const first = await create({ title: 'Первая', content: '' })
    await create({ title: 'Вторая', content: '' })
    await request(ctx.app, 'PATCH', `/articles/${first.body.id}`, { content: 'изменено' })

    expect(titles(await list())).toEqual(['Первая', 'Вторая'])
    expect(titles(await list('?sort=updatedAt&order=asc'))).toEqual(['Вторая', 'Первая'])
  })

  it('sorts by title, ascending by default', async () => {
    await create({ title: 'B article', content: '' })
    await create({ title: 'C article', content: '' })
    await create({ title: 'A article', content: '' })

    expect(titles(await list('?sort=title'))).toEqual(['A article', 'B article', 'C article'])
    expect(titles(await list('?sort=title&order=desc'))).toEqual([
      'C article',
      'B article',
      'A article',
    ])
  })
})

describe('GET /articles/:id/related', () => {
  it('lists articles sharing tags: most shared tags first, never the article itself', async () => {
    await seed()
    const [react] = await list('?search=react&sort=title')
    const res = await request(ctx.app, 'GET', `/articles/${react?.id}/related`)

    expect(res.status).toBe(200)
    // TypeScript shares two tags (javascript, programming); Git shares one (programming).
    expect(titles(res.body)).toEqual(['TypeScript', 'Git'])
  })

  it('respects the limit and returns nothing for an article without tags', async () => {
    await seed()
    const [react] = await list('?search=react&sort=title')
    expect(
      (await request(ctx.app, 'GET', `/articles/${react?.id}/related?limit=1`)).body,
    ).toHaveLength(1)

    const lonely = await create({ title: 'Без тегов', content: '' })
    expect((await request(ctx.app, 'GET', `/articles/${lonely.body.id}/related`)).body).toEqual([])
  })

  it('404 for an unknown id', async () => {
    const res = await request(ctx.app, 'GET', '/articles/nope/related')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND')
  })
})

describe('GET /articles/stats', () => {
  it('counts all articles regardless of filters', async () => {
    expect((await request(ctx.app, 'GET', '/articles/stats')).body).toEqual({ total: 0 })
    await seed()
    expect((await request(ctx.app, 'GET', '/articles/stats?tag=devops')).body).toEqual({ total: 4 })
  })
})

describe('validation', () => {
  const invalid = async (body: unknown) => {
    const res = await create(body as Record<string, unknown>)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    return res.body.error.details as { path: string; message: string }[]
  }

  it('requires a title and content', async () => {
    const paths = (await invalid({})).map((detail) => detail.path)
    expect(paths).toEqual(expect.arrayContaining(['title', 'content']))
    await invalid({ title: 'Только заголовок' })
    await invalid({ content: 'Только текст' })
  })

  it('rejects an empty or blank title', async () => {
    await invalid({ title: '', content: 'x' })
    await invalid({ title: '   ', content: 'x' })
  })

  it('limits the title to 200 and the description to 2000 characters', async () => {
    await invalid({ title: 'x'.repeat(201), content: 'x' })
    await invalid({ title: 'A', description: 'x'.repeat(2001), content: 'x' })
    expect(
      (await create({ title: 'x'.repeat(200), description: 'x'.repeat(2000), content: 'x' }))
        .status,
    ).toBe(201)
  })

  it('rejects wrong types', async () => {
    await invalid({ title: 1, content: 'x' })
    await invalid({ title: 'A', content: 5 })
    await invalid({ title: 'A', content: 'x', tags: 'react' })
    await invalid({ title: 'A', content: 'x', tags: ['ok', 3] })
  })

  it('limits tag length and count', async () => {
    await invalid({ title: 'A', content: 'x', tags: ['t'.repeat(51)] })
    await invalid({
      title: 'A',
      content: 'x',
      tags: Array.from({ length: 31 }, (_, i) => `tag${i}`),
    })
  })

  it('validates PATCH bodies too, and rejects an empty one', async () => {
    const created = await create({ title: 'A', content: 'x' })
    const patch = (body: unknown) => request(ctx.app, 'PATCH', `/articles/${created.body.id}`, body)

    expect((await patch({ title: '' })).status).toBe(400)
    expect((await patch({ tags: 'react' })).status).toBe(400)
    expect((await patch({ content: null })).status).toBe(400)
    expect((await patch({})).status).toBe(400)
  })

  it('validates the query string', async () => {
    for (const query of ['sort=priority', 'order=up', 'limit=1']) {
      const res = await request(ctx.app, 'GET', `/articles?${query}`)
      // `limit` is not a list parameter and is ignored; the other two are invalid.
      expect(res.status, query).toBe(query === 'limit=1' ? 200 : 400)
    }
  })
})
