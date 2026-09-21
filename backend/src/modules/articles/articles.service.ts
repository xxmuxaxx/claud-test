import { NotFoundError } from '../../common/errors/AppError.js'
import { splitSearchTerms } from '../../common/utils/search.js'
import { toArticleDto } from './articles.mapper.js'
import type { ArticlesRepository, ArticleOrder } from './articles.repository.js'
import type {
  CreateArticleInput,
  ListArticlesQuery,
  UpdateArticleInput,
} from './articles.schemas.js'
import { normalizeTag, normalizeTags } from './articles.tags.js'
import type { ArticleDto, ArticleRecord, ArticleStats } from './articles.types.js'

const articleNotFound = () => new NotFoundError('ARTICLE_NOT_FOUND', 'Article not found')

/** An empty description means "no description"; the database keeps NULL for that. */
const blankToNull = (value: string | null | undefined) => value || null

/** How much a word matters depending on where it is found. */
const FIELD_WEIGHTS = { title: 4, tags: 3, description: 2, content: 1 } as const

/** Lets "#react" find the tag "react". */
const stripHash = (term: string) => term.replace(/^#+/, '')

function relevance(article: ArticleRecord, terms: readonly string[]): number {
  const fields = {
    title: article.title.toLowerCase(),
    tags: article.tags.map(({ tag }) => tag.name).join(' '),
    description: (article.description ?? '').toLowerCase(),
    content: article.content.toLowerCase(),
  }
  let score = 0
  for (const term of terms) {
    for (const field of Object.keys(FIELD_WEIGHTS) as (keyof typeof FIELD_WEIGHTS)[]) {
      if (fields[field].includes(term)) score += FIELD_WEIGHTS[field]
    }
  }
  return score
}

/** `Array.prototype.sort` is stable, so equal scores keep the order the database gave. */
const rankBy = (articles: ArticleRecord[], score: (article: ArticleRecord) => number) =>
  articles
    .map((article) => ({ article, score: score(article) }))
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article)

export class ArticlesService {
  constructor(private readonly repository: ArticlesRepository) {}

  /** Filtering and ordering happen in the database; only the relevance ranking is done here. */
  async list(query: ListArticlesQuery): Promise<ArticleDto[]> {
    const terms = splitSearchTerms(query.search, stripHash)
    const tag = query.tag ? normalizeTag(query.tag) || undefined : undefined
    const sort = query.sort ?? (terms.length > 0 ? 'relevance' : 'updatedAt')

    let order: ArticleOrder
    if (sort === 'relevance') {
      // Ranked below; without search words there is nothing to rank by, so newest first.
      order = { field: 'updatedAt', direction: 'desc' }
    } else {
      order = { field: sort, direction: query.order ?? (sort === 'title' ? 'asc' : 'desc') }
    }

    const articles = await this.repository.list({ terms, tag }, order)
    const ranked =
      sort === 'relevance' && terms.length > 0
        ? rankBy(articles, (article) => relevance(article, terms))
        : articles
    return ranked.map(toArticleDto)
  }

  async get(id: string): Promise<ArticleDto> {
    const article = await this.repository.findById(id)
    if (!article) throw articleNotFound()
    return toArticleDto(article)
  }

  /** Articles sharing tags with this one: most shared tags first, then most recently updated. */
  async related(id: string, limit: number): Promise<ArticleDto[]> {
    const article = await this.repository.findById(id)
    if (!article) throw articleNotFound()

    const tags = new Set(article.tags.map(({ tag }) => tag.name))
    if (tags.size === 0) return []

    const others = await this.repository.findSharingTags(id, [...tags])
    const shared = (other: ArticleRecord) =>
      other.tags.filter(({ tag }) => tags.has(tag.name)).length
    return rankBy(others, shared).slice(0, limit).map(toArticleDto)
  }

  async create(input: CreateArticleInput): Promise<ArticleDto> {
    const article = await this.repository.create(
      {
        title: input.title,
        description: blankToNull(input.description),
        content: input.content,
      },
      normalizeTags(input.tags),
    )
    return toArticleDto(article)
  }

  async update(id: string, patch: UpdateArticleInput): Promise<ArticleDto> {
    const article = await this.repository.update(
      id,
      {
        title: patch.title,
        content: patch.content,
        // `undefined` leaves a field alone; `null` clears it.
        description: patch.description === undefined ? undefined : blankToNull(patch.description),
      },
      patch.tags && normalizeTags(patch.tags),
    )
    if (!article) throw articleNotFound()
    return toArticleDto(article)
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) throw articleNotFound()
  }

  async stats(): Promise<ArticleStats> {
    return { total: await this.repository.count() }
  }
}
