import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WIKI_STORAGE_KEY } from '@/services/localStorageWikiStorage'
import type { WikiArticle } from '@/types/wiki'
import { useWikiStore } from './useWikiStore'

const stored = (): WikiArticle[] => JSON.parse(localStorage.getItem(WIKI_STORAGE_KEY) ?? '[]')

async function freshStore() {
  useWikiStore.setState({ articles: [], status: 'idle' })
  await useWikiStore.getState().load()
}

const input = { title: 'React', content: '# React', tags: ['frontend'] }

describe('useWikiStore', () => {
  beforeEach(async () => {
    localStorage.clear()
    await freshStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates an article with a unique id and timestamps, and persists it', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-20T10:00:00.000Z') })
    const { createArticle } = useWikiStore.getState()

    const first = await createArticle({ ...input, description: 'Кратко' })
    const second = await createArticle(input)

    expect(first).toEqual({
      ...input,
      description: 'Кратко',
      id: expect.any(String),
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-20T10:00:00.000Z',
    })
    expect(second.id).not.toBe(first.id)
    expect(useWikiStore.getState().articles).toEqual([first, second])
    expect(stored()).toEqual([first, second])
  })

  it('edits an article: updates fields and updatedAt, keeps id and createdAt', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-20T10:00:00.000Z') })
    const created = await useWikiStore
      .getState()
      .createArticle({ ...input, description: 'Старое описание' })

    vi.setSystemTime(new Date('2026-09-21T10:00:00.000Z'))
    const updated = await useWikiStore
      .getState()
      .updateArticle(created.id, { title: 'React 19', content: 'Новое', tags: ['react'] })

    expect(updated).toEqual({
      id: created.id,
      title: 'React 19',
      content: 'Новое',
      tags: ['react'], // The description was cleared, so it is gone.
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-21T10:00:00.000Z',
    })
    expect(useWikiStore.getState().articles).toEqual([updated])
    expect(stored()).toEqual([updated])
  })

  it('rejects an update of an unknown article', async () => {
    await expect(useWikiStore.getState().updateArticle('nope', input)).rejects.toThrow('not found')
  })

  it('removes an article', async () => {
    const { createArticle, removeArticle } = useWikiStore.getState()
    const first = await createArticle({ ...input, title: 'Первая' })
    await createArticle({ ...input, title: 'Вторая' })

    await removeArticle(first.id)

    expect(useWikiStore.getState().articles.map((a) => a.title)).toEqual(['Вторая'])
    expect(stored().map((a) => a.title)).toEqual(['Вторая'])
  })

  it('restores articles from localStorage after a reload', async () => {
    const created = await useWikiStore.getState().createArticle(input)

    await freshStore()

    expect(useWikiStore.getState().articles).toEqual([created])
  })

  it('stores articles as an array under the "wiki_articles" key', async () => {
    await useWikiStore.getState().createArticle(input)

    expect(WIKI_STORAGE_KEY).toBe('wiki_articles')
    expect(Array.isArray(stored())).toBe(true)
  })

  it('ignores corrupted storage contents', async () => {
    localStorage.setItem(WIKI_STORAGE_KEY, '{not json')
    await freshStore()
    expect(useWikiStore.getState().articles).toEqual([])

    const valid = { ...input, id: '1', createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    localStorage.setItem(
      WIKI_STORAGE_KEY,
      JSON.stringify([valid, { id: 2 }, { ...valid, tags: 'x' }]),
    )
    await freshStore()
    expect(useWikiStore.getState().articles.map((a) => a.id)).toEqual(['1'])
  })
})
