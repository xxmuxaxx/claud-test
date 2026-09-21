import type { WikiArticle, WikiArticleInput, WikiListQuery } from '@/types/wiki'
import { ApiError, apiRequest } from './http'

/** An article as the backend sends it. */
interface ArticleDto {
  id: string
  title: string
  description?: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

function toArticle(dto: ArticleDto): WikiArticle {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    content: dto.content,
    tags: dto.tags,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

/** The editor replaces every field, so a cleared description is sent as `null`. */
const toBody = (input: WikiArticleInput) => ({ ...input, description: input.description ?? null })

const articlePath = (id: string) => `/articles/${encodeURIComponent(id)}`

export const articlesApi = {
  /** Search and tag filtering happen on the server. */
  async list({ search, tag }: WikiListQuery = {}): Promise<WikiArticle[]> {
    const dtos = await apiRequest<ArticleDto[]>('GET', '/articles', { query: { search, tag } })
    return dtos.map(toArticle)
  },

  /** Resolves with `null` when there is no such article. */
  async get(id: string): Promise<WikiArticle | null> {
    try {
      return toArticle(await apiRequest<ArticleDto>('GET', articlePath(id)))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  async related(id: string): Promise<WikiArticle[]> {
    const dtos = await apiRequest<ArticleDto[]>('GET', `${articlePath(id)}/related`)
    return dtos.map(toArticle)
  },

  stats: () => apiRequest<{ total: number }>('GET', '/articles/stats'),

  async create(input: WikiArticleInput): Promise<WikiArticle> {
    return toArticle(await apiRequest<ArticleDto>('POST', '/articles', { body: toBody(input) }))
  },

  async update(id: string, input: WikiArticleInput): Promise<WikiArticle> {
    const dto = await apiRequest<ArticleDto>('PATCH', articlePath(id), { body: toBody(input) })
    return toArticle(dto)
  },

  remove: (id: string) => apiRequest<void>('DELETE', articlePath(id)),
}
