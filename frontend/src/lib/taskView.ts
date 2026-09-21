import type { TaskQuery } from '@/api/tasksApi'
import type { Task, TaskPriority } from '@/types/task'
import { toISODate } from './dates'

export type StatusFilter = 'all' | 'active' | 'completed'
export type PriorityFilter = 'all' | TaskPriority
export type SortOption = 'newest' | 'oldest' | 'priority' | 'dueDate'

/** Everything the user can change to narrow down or reorder the list. */
export interface TaskView {
  query: string
  status: StatusFilter
  priority: PriorityFilter
  sort: SortOption
}

export const DEFAULT_TASK_VIEW: TaskView = {
  query: '',
  status: 'all',
  priority: 'all',
  sort: 'newest',
}

export function isOverdue(task: Task, today: string = toISODate(new Date())): boolean {
  return !task.completed && task.dueDate !== undefined && task.dueDate < today
}

const SORTS: Record<SortOption, Pick<TaskQuery, 'sort' | 'order'>> = {
  newest: { sort: 'createdAt', order: 'desc' },
  oldest: { sort: 'createdAt', order: 'asc' },
  priority: { sort: 'priority', order: 'desc' }, // Highest first.
  dueDate: { sort: 'dueDate', order: 'asc' }, // Soonest first; no date last (the backend does that).
}

/** Translates what the toolbar shows into the backend's query parameters. */
export function toTaskQuery(view: TaskView): TaskQuery {
  return {
    search: view.query.trim() || undefined,
    status: view.status === 'all' ? undefined : view.status,
    priority: view.priority === 'all' ? undefined : view.priority,
    ...SORTS[view.sort],
  }
}
