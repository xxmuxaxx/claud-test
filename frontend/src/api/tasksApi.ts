import type { Task, TaskInput, TaskPriority, TaskStats } from '@/types/task'
import { apiRequest } from './http'

/** A task as the backend sends it. */
interface TaskDto {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type TaskQuery = {
  search?: string
  status?: 'active' | 'completed'
  priority?: TaskPriority
  sort?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title'
  order?: 'asc' | 'desc'
}

/** A key that is present with the value `undefined` means "clear this field". */
export type TaskPatch = Partial<Omit<Task, 'id'>>

function toTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    completed: dto.completed,
    priority: dto.priority,
    dueDate: dto.dueDate ?? undefined,
  }
}

function toPatchBody(patch: TaskPatch) {
  const { description, dueDate, ...rest } = patch
  return {
    ...rest,
    // JSON drops `undefined`; the backend clears a field on `null`.
    ...('description' in patch && { description: description ?? null }),
    ...('dueDate' in patch && { dueDate: dueDate ?? null }),
  }
}

export const tasksApi = {
  async list(query: TaskQuery = {}): Promise<Task[]> {
    const dtos = await apiRequest<TaskDto[]>('GET', '/tasks', { query })
    return dtos.map(toTask)
  },

  stats: () => apiRequest<TaskStats>('GET', '/tasks/stats'),

  async create(input: TaskInput): Promise<Task> {
    return toTask(await apiRequest<TaskDto>('POST', '/tasks', { body: input }))
  },

  async update(id: string, patch: TaskPatch): Promise<Task> {
    const dto = await apiRequest<TaskDto>('PATCH', `/tasks/${encodeURIComponent(id)}`, {
      body: toPatchBody(patch),
    })
    return toTask(dto)
  },

  remove: (id: string) => apiRequest<void>('DELETE', `/tasks/${encodeURIComponent(id)}`),
}
