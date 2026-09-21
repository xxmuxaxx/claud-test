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

export const PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high']

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}
