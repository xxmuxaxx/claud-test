import { z } from 'zod'
import { searchQuerySchema, sortOrderSchema } from '../../common/schemas/index.js'

export const prioritySchema = z.enum(['low', 'medium', 'high'])

const titleSchema = z.string().trim().min(1).max(200)
const descriptionSchema = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .describe('Up to 2000 characters; null or empty clears it')
const dueDateSchema = z.iso.date().nullable().describe('Calendar date `YYYY-MM-DD`, or null')

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  priority: prioritySchema,
  dueDate: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const createTaskBodySchema = z.object({
  title: titleSchema.describe('1–200 characters'),
  description: descriptionSchema.optional(),
  priority: prioritySchema.default('medium'),
  dueDate: dueDateSchema.optional(),
})
export type CreateTaskInput = z.infer<typeof createTaskBodySchema>

export const updateTaskBodySchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    completed: z.boolean(),
    priority: prioritySchema,
    dueDate: dueDateSchema,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })
export type UpdateTaskInput = z.infer<typeof updateTaskBodySchema>

export const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'] as const

export const listTasksQuerySchema = z.object({
  search: searchQuerySchema.describe('Searches title and description'),
  status: z.enum(['all', 'active', 'completed']).default('all'),
  priority: prioritySchema.optional(),
  sort: z.enum(TASK_SORT_FIELDS).default('createdAt'),
  order: sortOrderSchema
    .optional()
    .describe('Default: `asc` for title and dueDate, `desc` otherwise'),
})
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>

export const taskStatsSchema = z.object({
  total: z.number().int(),
  active: z.number().int(),
  completed: z.number().int(),
})
