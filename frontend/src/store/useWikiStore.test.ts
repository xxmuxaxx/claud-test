import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/http'
import { backend } from '@/test/fakeBackend'
import { useWikiStore } from './useWikiStore'

const state = () => useWikiStore.getState()
const input = { title: 'React', content: '# React', tags: ['frontend'] }

describe('useWikiStore', () => {
  beforeEach(() => {
    useWikiStore.setState({ tags: [], total: 0, status: 'idle', error: undefined })
  })

  it('loads the tag counts and the number of articles', async () => {
    backend.seedArticles([
      { id: 'a', title: 'A', content: '', tags: ['x', 'y'], createdAt: '', updatedAt: '' },
      { id: 'b', title: 'B', content: '', tags: ['y'], createdAt: '', updatedAt: '' },
    ])

    await state().load()

    expect(state().status).toBe('ready')
    expect(state().total).toBe(2)
    expect(state().tags).toEqual([
      { tag: 'y', count: 2 },
      { tag: 'x', count: 1 },
    ])
  })

  it('loads only once; refresh loads again', async () => {
    await state().load()
    await state().load()
    expect(backend.count('GET /tags')).toBe(1)

    await state().refresh()
    expect(backend.count('GET /tags')).toBe(2)
  })

  it('creates an article on the backend and refreshes the numbers', async () => {
    const created = await state().createArticle({ ...input, description: 'Кратко' })

    expect(created).toMatchObject({ ...input, description: 'Кратко', id: expect.any(String) })
    expect(created.createdAt).toBe(created.updatedAt)
    expect(backend.articles).toHaveLength(1)
    expect(state().total).toBe(1)
    expect(state().tags).toEqual([{ tag: 'frontend', count: 1 }])
  })

  it('returns the article as the backend stored it (tags normalized)', async () => {
    const created = await state().createArticle({ ...input, tags: ['#Frontend', 'react'] })
    expect(created.tags).toEqual(['frontend', 'react'])
  })

  it('edits an article: updates fields and updatedAt, keeps id and createdAt', async () => {
    const created = await state().createArticle({ ...input, description: 'Старое описание' })

    const updated = await state().updateArticle(created.id, {
      title: 'React 19',
      content: 'Новое',
      tags: ['react'],
    })

    expect(updated).toEqual({
      id: created.id,
      title: 'React 19',
      content: 'Новое',
      tags: ['react'],
      description: undefined, // Cleared: the editor replaces every field.
      createdAt: created.createdAt,
      updatedAt: expect.any(String),
    })
    expect(updated.updatedAt > created.updatedAt).toBe(true)
    expect(state().tags).toEqual([{ tag: 'react', count: 1 }])
  })

  it('removes an article and its tags from the numbers', async () => {
    const first = await state().createArticle({ ...input, tags: ['only-first'] })
    await state().createArticle({ ...input, title: 'Другая', tags: ['other'] })

    await state().removeArticle(first.id)

    expect(state().total).toBe(1)
    expect(state().tags).toEqual([{ tag: 'other', count: 1 }])
  })

  it('reports an unreachable backend', async () => {
    backend.offline = true
    await state().load()

    expect(state().status).toBe('error')
    expect(state().error).toBeInstanceOf(ApiError)

    backend.offline = false
    await state().refresh()
    expect(state().status).toBe('ready')
  })
})
