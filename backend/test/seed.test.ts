import { describe, expect, it } from 'vitest'
import { seedDatabase } from '../src/database/seedData.js'
import { request, useTestApp } from './helpers.js'

const ctx = useTestApp()

describe('seed', () => {
  it('fills empty tables with varied tasks and the four wiki articles', async () => {
    const result = await seedDatabase(ctx.prisma, new Date('2026-09-21T12:00:00Z'))
    expect(result).toEqual({ tasks: 6, articles: 4 })

    const tasks = (await request(ctx.app, 'GET', '/tasks')).body
    expect(new Set(tasks.map((t: { priority: string }) => t.priority))).toEqual(
      new Set(['low', 'medium', 'high']),
    )
    expect(tasks.some((t: { completed: boolean }) => t.completed)).toBe(true)
    expect(tasks.some((t: { completed: boolean }) => !t.completed)).toBe(true)
    expect(tasks.some((t: { dueDate: string | null }) => t.dueDate === null)).toBe(true)
    // Relative to the fixed "now": one task is overdue, one is due in three days.
    expect(tasks.map((t: { dueDate: string | null }) => t.dueDate)).toEqual(
      expect.arrayContaining(['2026-09-19', '2026-09-24']),
    )

    const articles = (await request(ctx.app, 'GET', '/articles?sort=title')).body
    expect(articles.map((a: { title: string }) => a.title)).toEqual([
      'Docker',
      'Git',
      'React',
      'TypeScript',
    ])
    expect((await request(ctx.app, 'GET', '/tags')).body).toEqual([
      { name: 'programming', articleCount: 3 },
      { name: 'devops', articleCount: 2 },
      { name: 'javascript', articleCount: 2 },
      { name: 'frontend', articleCount: 1 },
    ])
  })

  it('is safe to run twice: existing data is never duplicated', async () => {
    await seedDatabase(ctx.prisma)
    const second = await seedDatabase(ctx.prisma)

    expect(second).toEqual({ tasks: 0, articles: 0 })
    expect((await request(ctx.app, 'GET', '/tasks')).body).toHaveLength(6)
    expect((await request(ctx.app, 'GET', '/articles')).body).toHaveLength(4)
  })
})
