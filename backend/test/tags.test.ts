import { describe, expect, it } from 'vitest'
import { request, useTestApp } from './helpers.js'

const ctx = useTestApp()

const create = (title: string, tags: string[]) =>
  request(ctx.app, 'POST', '/articles', { title, content: '', tags })
const tags = async () =>
  (await request(ctx.app, 'GET', '/tags')).body as { name: string; articleCount: number }[]

describe('GET /tags', () => {
  it('is empty without articles', async () => {
    const res = await request(ctx.app, 'GET', '/tags')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('lists the tags of the articles with how many articles use each', async () => {
    await create('React', ['frontend', 'javascript', 'programming'])
    await create('TypeScript', ['javascript', 'programming'])
    await create('Docker', ['devops'])

    expect(await tags()).toEqual([
      { name: 'javascript', articleCount: 2 },
      { name: 'programming', articleCount: 2 },
      { name: 'devops', articleCount: 1 },
      { name: 'frontend', articleCount: 1 },
    ])
  })

  it('shares one tag between many articles instead of duplicating it', async () => {
    await create('A', ['shared'])
    await create('B', ['#Shared'])
    await create('C', ['shared'])

    expect(await tags()).toEqual([{ name: 'shared', articleCount: 3 }])
    expect(await ctx.prisma.tag.count()).toBe(1)
  })

  it('follows article edits: new tags appear, dropped tags disappear', async () => {
    const article = await create('React', ['react', 'old'])

    await request(ctx.app, 'PATCH', `/articles/${article.body.id}`, { tags: ['react', 'new'] })

    expect((await tags()).map((tag) => tag.name).sort()).toEqual(['new', 'react'])
  })

  it('a tag used by two articles survives when one of them is deleted', async () => {
    const first = await create('A', ['shared', 'only-a'])
    await create('B', ['shared'])

    await request(ctx.app, 'DELETE', `/articles/${first.body.id}`)

    expect(await tags()).toEqual([{ name: 'shared', articleCount: 1 }])
  })

  it('a tag disappears with its last article', async () => {
    const article = await create('A', ['lonely'])
    expect(await tags()).toHaveLength(1)

    await request(ctx.app, 'DELETE', `/articles/${article.body.id}`)

    expect(await tags()).toEqual([])
  })

  it('links tags to articles both ways: /tags names work as the ?tag= filter', async () => {
    await create('React', ['frontend', 'javascript'])
    await create('Docker', ['devops'])

    for (const { name } of await tags()) {
      const res = await request(ctx.app, 'GET', `/articles?tag=${name}`)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].tags).toContain(name)
    }
  })
})
