import type { PrismaClient } from '../../database/prisma.js'

export interface TagUsage {
  name: string
  articleCount: number
}

export class TagsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Only tags that at least one article uses: tags are derived from the wiki articles. */
  async listUsed(): Promise<TagUsage[]> {
    const tags = await this.prisma.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true, _count: { select: { articles: true } } },
    })
    return tags.map(({ name, _count }) => ({ name, articleCount: _count.articles }))
  }
}
