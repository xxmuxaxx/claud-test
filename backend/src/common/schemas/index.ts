import { z } from 'zod'

export const sortOrderSchema = z.enum(['asc', 'desc']).describe('Sort direction')
export type SortOrder = z.infer<typeof sortOrderSchema>

/** Ids are opaque strings: an unknown id is a 404, never a validation error. */
export const idParamsSchema = z.object({
  id: z.string().min(1).max(100).describe('Resource id'),
})

export const searchQuerySchema = z
  .string()
  .trim()
  .max(200)
  .optional()
  .describe('Case-insensitive search; every word has to match')

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().describe('Stable machine-readable code, e.g. TASK_NOT_FOUND'),
      message: z.string(),
      details: z
        .array(z.object({ path: z.string(), message: z.string() }))
        .optional()
        .describe('Per-field problems of a VALIDATION_ERROR'),
    }),
  })
  .describe('Error')

/** Response schemas shared by every route that takes an id. */
export const notFoundResponses = {
  400: errorResponseSchema,
  404: errorResponseSchema,
} as const
