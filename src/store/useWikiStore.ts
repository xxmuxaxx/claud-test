import { create } from 'zustand'
import { wikiStorage } from '@/services/wikiStorage'
import type { WikiArticle, WikiArticleInput } from '@/types/wiki'

interface WikiState {
  /** Ordered oldest-first, as stored. */
  articles: WikiArticle[]
  status: 'idle' | 'loading' | 'ready'
  load: () => Promise<void>
  createArticle: (input: WikiArticleInput) => Promise<WikiArticle>
  updateArticle: (id: string, input: WikiArticleInput) => Promise<WikiArticle>
  removeArticle: (id: string) => Promise<void>
}

export const useWikiStore = create<WikiState>((set, get) => ({
  articles: [],
  status: 'idle',

  load: async () => {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    const articles = await wikiStorage.list()
    set({ articles, status: 'ready' })
  },

  createArticle: async (input) => {
    const article = await wikiStorage.create(input)
    set((state) => ({ articles: [...state.articles, article] }))
    return article
  },

  updateArticle: async (id, input) => {
    const updated = await wikiStorage.update(id, input)
    set((state) => ({
      articles: state.articles.map((article) => (article.id === id ? updated : article)),
    }))
    return updated
  },

  removeArticle: async (id) => {
    await wikiStorage.remove(id)
    set((state) => ({ articles: state.articles.filter((article) => article.id !== id) }))
  },
}))
