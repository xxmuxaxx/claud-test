import type { TaskDto, TaskRecord } from './tasks.types.js'

/** `dueDate` is a `date` column: Prisma returns it as UTC midnight, the API as `YYYY-MM-DD`. */
export const toDateString = (date: Date) => date.toISOString().slice(0, 10)

export const fromDateString = (value: string) => new Date(`${value}T00:00:00.000Z`)

export function toTaskDto(task: TaskRecord): TaskDto {
  return {
    id: task.id,
    title: task.title,
    ...(task.description !== null && { description: task.description }),
    completed: task.completed,
    priority: task.priority,
    dueDate: task.dueDate ? toDateString(task.dueDate) : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}
