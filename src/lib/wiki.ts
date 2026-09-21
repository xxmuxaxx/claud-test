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

/** How much a term matters depending on where it is found. */
const FIELD_WEIGHTS = { title: 4, tags: 3, description: 2, content: 1 } as const

function scoreArticle(article: WikiArticle, terms: readonly string[]): number {
  const fields: Record<keyof typeof FIELD_WEIGHTS, string> = {
    title: article.title.toLowerCase(),
    tags: article.tags.join(' '),
    description: (article.description ?? '').toLowerCase(),
    content: article.content.toLowerCase(),
  }
  let score = 0
  for (const term of terms) {
    let termScore = 0
    for (const field of Object.keys(FIELD_WEIGHTS) as (keyof typeof FIELD_WEIGHTS)[]) {
      if (fields[field].includes(term)) termScore += FIELD_WEIGHTS[field]
    }
    if (termScore === 0) return 0 // Every word has to be found somewhere.
    score += termScore
  }
  return score
}

/** Lets "#react" find the tag "react". */
const stripHash = (term: string) => term.replace(/^#+/, '')

/**
 * Case-insensitive search over title, description, content and tags. Every whitespace-separated
 * word must match; better matches (title, tags) first, then most recently updated.
 */
export function searchArticles(articles: readonly WikiArticle[], query: string): WikiArticle[] {
  const terms = query.toLowerCase().split(/\s+/).map(stripHash).filter(Boolean)
  if (terms.length === 0) return sortByUpdated(articles)

  return articles
    .map((article) => ({ article, score: scoreArticle(article, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || byUpdatedDesc(a.article, b.article))
    .map(({ article }) => article)
}

export interface TagCount {
  tag: string
  count: number
}

/** Every tag with its article count: most used first, then alphabetically. */
export function getTagCounts(articles: readonly WikiArticle[]): TagCount[] {
  const counts = new Map<string, number>()
  for (const { tags } of articles) {
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function filterByTag(articles: readonly WikiArticle[], tag: string): WikiArticle[] {
  return articles.filter((article) => article.tags.includes(tag))
}

/** Articles sharing tags with `article`: most shared tags first, then most recently updated. */
export function getRelatedArticles(
  articles: readonly WikiArticle[],
  article: WikiArticle,
  limit = 3,
): WikiArticle[] {
  const tags = new Set(article.tags)
  return articles
    .filter((other) => other.id !== article.id)
    .map((other) => ({ other, shared: other.tags.filter((tag) => tags.has(tag)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || byUpdatedDesc(a.other, b.other))
    .slice(0, limit)
    .map(({ other }) => other)
}

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
