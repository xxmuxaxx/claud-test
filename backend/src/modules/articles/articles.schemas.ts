import { z } from 'zod'
import { searchQuerySchema, sortOrderSchema } from '../../common/schemas/index.js'

const titleSchema = z.string().trim().min(1).max(200)
const descriptionSchema = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .describe('Up to 2000 characters; null or empty clears it')
const tagsSchema = z
  .array(z.string().trim().max(50))
  .max(30)
  .describe('Normalized on save: lowercase, no leading `#`, spaces become dashes, no duplicates')
// Markdown source. Required, but an empty article is allowed (the editor allows it too).
const contentSchema = z.string().describe('Markdown source')

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const createArticleBodySchema = z.object({
  title: titleSchema.describe('1–200 characters'),
  description: descriptionSchema.optional(),
  content: contentSchema,
  tags: tagsSchema.default([]),
})
export type CreateArticleInput = z.infer<typeof createArticleBodySchema>

export const updateArticleBodySchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    content: contentSchema,
    tags: tagsSchema,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })
export type UpdateArticleInput = z.infer<typeof updateArticleBodySchema>

export const ARTICLE_SORT_FIELDS = ['relevance', 'createdAt', 'updatedAt', 'title'] as const

export const listArticlesQuerySchema = z.object({
  search: searchQuerySchema.describe(
    'Searches title, description, content and tags; every word has to match',
  ),
  tag: z.string().trim().max(50).optional().describe('Only articles with this tag'),
  sort: z
    .enum(ARTICLE_SORT_FIELDS)
    .optional()
    .describe(
      'Default: `relevance` (title > tags > description > content) when searching, otherwise `updatedAt`',
    ),
  order: sortOrderSchema
    .optional()
    .describe('Default: `asc` for title, `desc` otherwise. Ignored for `relevance`'),
})
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>

export const relatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(3),
})

export const articleStatsSchema = z.object({ total: z.number().int() })
