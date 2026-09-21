import type { WikiArticle, WikiArticleInput } from '@/types/wiki'
import { localStorageWikiStorage } from './localStorageWikiStorage'

/**
 * Persistence contract for wiki articles. It mirrors a REST resource, so an HTTP-backed
 * implementation can replace the localStorage one by changing `wikiStorage` below; the store
 * and UI depend only on this interface. The storage assigns `id`, `createdAt` and `updatedAt`.
 */
export interface WikiStorage {
  list(): Promise<WikiArticle[]>
  create(input: WikiArticleInput): Promise<WikiArticle>
  update(id: string, input: WikiArticleInput): Promise<WikiArticle>
  remove(id: string): Promise<void>
}

export const wikiStorage: WikiStorage = localStorageWikiStorage
