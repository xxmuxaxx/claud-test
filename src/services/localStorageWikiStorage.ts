import type { WikiArticle } from '@/types/wiki'
import type { WikiStorage } from './wikiStorage'

export const WIKI_STORAGE_KEY = 'wiki_articles'

function isWikiArticle(value: unknown): value is WikiArticle {
  if (typeof value !== 'object' || value === null) return false
  const article = value as Record<string, unknown>
  return (
    typeof article.id === 'string' &&
    typeof article.title === 'string' &&
    typeof article.content === 'string' &&
    typeof article.createdAt === 'string' &&
    typeof article.updatedAt === 'string' &&
    (article.description === undefined || typeof article.description === 'string') &&
    Array.isArray(article.tags) &&
    article.tags.every((tag) => typeof tag === 'string')
  )
}

function readArticles(): WikiArticle[] {
  try {
    const raw = localStorage.getItem(WIKI_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isWikiArticle) : []
  } catch {
    // Corrupted or inaccessible storage: start from an empty wiki.
    return []
  }
}

function writeArticles(articles: WikiArticle[]): void {
  localStorage.setItem(WIKI_STORAGE_KEY, JSON.stringify(articles))
}

// `randomUUID` exists only in secure contexts (https / localhost).
function createId(): string {
  return (
    crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}

export const localStorageWikiStorage: WikiStorage = {
  async list() {
    return readArticles()
  },

  async create(input) {
    const now = new Date().toISOString()
    const article: WikiArticle = { ...input, id: createId(), createdAt: now, updatedAt: now }
    writeArticles([...readArticles(), article])
    return article
  },

  async update(id, input) {
    const articles = readArticles()
    const current = articles.find((article) => article.id === id)
    if (!current) throw new Error(`Article ${id} not found`)
    // The input replaces every editable field, so a cleared description really disappears.
    const updated: WikiArticle = {
      ...input,
      id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    writeArticles(articles.map((article) => (article.id === id ? updated : article)))
    return updated
  },

  async remove(id) {
    writeArticles(readArticles().filter((article) => article.id !== id))
  },
}
