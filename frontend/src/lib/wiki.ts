import type { WikiArticle } from '@/types/wiki'

/** "#React " -> "react": tags are stored lowercase, without `#`, spaces become dashes. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').trim().toLowerCase().replace(/\s+/g, '-')
}

/** Normalizes, drops empty tags and duplicates, keeps the original order. */
export function normalizeTags(raw: readonly string[]): string[] {
  return [...new Set(raw.map(normalizeTag).filter(Boolean))]
}

const byUpdatedDesc = (a: WikiArticle, b: WikiArticle) => b.updatedAt.localeCompare(a.updatedAt)
const byCreatedDesc = (a: WikiArticle, b: WikiArticle) => b.createdAt.localeCompare(a.createdAt)

export const sortByUpdated = (articles: readonly WikiArticle[]) => [...articles].sort(byUpdatedDesc)
export const sortByCreated = (articles: readonly WikiArticle[]) => [...articles].sort(byCreatedDesc)

/** Text for list cards: the description, or a plain-text start of the content without it. */
export function getExcerpt(article: WikiArticle, maxLength = 160): string {
  if (article.description) return article.description
  const plain = article.content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trimEnd()}…` : plain
}

/** Route of a tag page. */
export const tagPath = (tag: string) => `/wiki/tags/${encodeURIComponent(tag)}`
