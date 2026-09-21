import type { ArticleDto, ArticleRecord } from './articles.types.js'

export function toArticleDto(article: ArticleRecord): ArticleDto {
  return {
    id: article.id,
    title: article.title,
    ...(article.description !== null && { description: article.description }),
    content: article.content,
    tags: article.tags.map(({ tag }) => tag.name),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  }
}
