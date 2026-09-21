import { create } from 'zustand'
import { articlesApi } from '@/api/articlesApi'
import { tagsApi } from '@/api/tagsApi'
import type { TagCount, WikiArticle, WikiArticleInput } from '@/types/wiki'

/**
 * Wiki-wide numbers shown next to the article lists (sidebar, stats, empty state). The lists
 * themselves are requested per page (see `hooks/useArticles`), so search never needs the whole
 * wiki in the browser; here go the writes, which keep these numbers fresh.
 */
interface WikiState {
  /** Every tag in use, most used first. */
  tags: TagCount[]
  /** Number of articles in the whole wiki. */
  total: number
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: unknown
  /** Loads the numbers once; later calls do nothing (see `refresh`). */
  load: () => Promise<void>
  refresh: () => Promise<void>
  createArticle: (input: WikiArticleInput) => Promise<WikiArticle>
  updateArticle: (id: string, input: WikiArticleInput) => Promise<WikiArticle>
  removeArticle: (id: string) => Promise<void>
}

export const useWikiStore = create<WikiState>((set, get) => ({
  tags: [],
  total: 0,
  status: 'idle',
  error: undefined,

  load: async () => {
    if (get().status === 'idle') await get().refresh()
  },

  refresh: async () => {
    set((state) => ({ status: state.status === 'ready' ? 'ready' : 'loading' }))
    try {
      const [tags, { total }] = await Promise.all([tagsApi.list(), articlesApi.stats()])
      set({ tags, total, status: 'ready', error: undefined })
    } catch (error) {
      set({ status: 'error', error })
    }
  },

  createArticle: async (input) => {
    const article = await articlesApi.create(input)
    await get().refresh()
    return article
  },

  updateArticle: async (id, input) => {
    const article = await articlesApi.update(id, input)
    await get().refresh()
    return article
  },

  removeArticle: async (id) => {
    await articlesApi.remove(id)
    await get().refresh()
  },
}))
