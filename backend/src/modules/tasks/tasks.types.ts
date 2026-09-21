import type { Task } from '../../generated/prisma/client.js'

export type TaskRecord = Task

/** The public shape of a task. */
export interface TaskDto {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  /** `YYYY-MM-DD` or null. */
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskStats {
  total: number
  active: number
  completed: number
}
