import type { Prisma } from '../../generated/prisma/client.js'
import { isRecordNotFound } from '../../common/errors/prismaErrors.js'
import { escapeLike } from '../../common/utils/search.js'
import type { PrismaClient } from '../../database/prisma.js'
import { articleInclude, type ArticleRecord } from './articles.types.js'

export interface ArticleFilter {
  /** Lowercase words; each must match the title, description, content or a tag. */
  terms: string[]
  /** Normalized tag name. */
  tag?: string
}

export interface ArticleFields {
  title: string
  description: string | null
  content: string
}

export interface ArticleOrder {
  field: 'createdAt' | 'updatedAt' | 'title'
  direction: 'asc' | 'desc'
}

function buildWhere({ terms, tag }: ArticleFilter): Prisma.ArticleWhereInput {
  return {
    ...(tag && { tags: { some: { tag: { name: tag } } } }),
    AND: terms.map(escapeLike).map((term) => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: term } } } } },
      ],
    })),
  }
}

/** Nested write that replaces the article's tag links, creating tags that do not exist yet. */
function tagLinks(tags: readonly string[]) {
  return tags.map((name, position) => ({
    position,
    tag: { connectOrCreate: { where: { name }, create: { name } } },
  }))
}

export class ArticlesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(
    filter: ArticleFilter,
    order: ArticleOrder = { field: 'updatedAt', direction: 'desc' },
  ): Promise<ArticleRecord[]> {
    return this.prisma.article.findMany({
      where: buildWhere(filter),
      include: articleInclude,
      // `id` keeps the order deterministic when timestamps tie.
      orderBy: [{ [order.field]: order.direction }, { id: 'asc' }],
    })
  }

  findById(id: string): Promise<ArticleRecord | null> {
    return this.prisma.article.findUnique({ where: { id }, include: articleInclude })
  }

  /** Articles that carry at least one of the given tags, except `excludeId`. */
  findSharingTags(excludeId: string, tags: readonly string[]): Promise<ArticleRecord[]> {
    return this.prisma.article.findMany({
      where: { id: { not: excludeId }, tags: { some: { tag: { name: { in: [...tags] } } } } },
      include: articleInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    })
  }

  create(fields: ArticleFields, tags: readonly string[]): Promise<ArticleRecord> {
    return this.prisma.article.create({
      data: { ...fields, tags: { create: tagLinks(tags) } },
      include: articleInclude,
    })
  }

  /** `tags` undefined keeps the current tags. Returns null when the article does not exist. */
  async update(
    id: string,
    fields: Partial<ArticleFields>,
    tags?: readonly string[],
  ): Promise<ArticleRecord | null> {
    try {
      return await this.prisma.article.update({
        where: { id },
        data: {
          ...fields,
          ...(tags && { tags: { deleteMany: {}, create: tagLinks(tags) } }),
        },
        include: articleInclude,
      })
    } catch (error) {
      if (isRecordNotFound(error)) return null
      throw error
    }
  }

  /** Returns false when the article does not exist. Its tag links go with it (ON DELETE CASCADE). */
  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.article.deleteMany({ where: { id } })
    return count > 0
  }

  count(): Promise<number> {
    return this.prisma.article.count()
  }
}
