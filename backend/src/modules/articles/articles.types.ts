import type { Prisma } from '../../generated/prisma/client.js'

/** Tags come back in the order the author gave them. */
export const articleInclude = {
  tags: {
    orderBy: { position: 'asc' },
    select: { tag: { select: { name: true } } },
  },
} satisfies Prisma.ArticleInclude

export type ArticleRecord = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>

/** The public shape of an article. */
export interface ArticleDto {
  id: string
  title: string
  description?: string
  /** Markdown source. */
  content: string
  /** Normalized (lowercase, no `#`), unique. */
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ArticleStats {
  total: number
}
