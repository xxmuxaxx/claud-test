export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: TaskPriority
  /** Calendar date in `YYYY-MM-DD` format (the value of `<input type="date">`). */
  dueDate?: string
}

/** Fields the user edits in the form; `id` and `completed` are managed by the app. */
export type TaskInput = Omit<Task, 'id' | 'completed'>

/** Counters over all tasks, whatever filter is applied to the list. */
export interface TaskStats {
  total: number
  active: number
  completed: number
}

export const PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high']
