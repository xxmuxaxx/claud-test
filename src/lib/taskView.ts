import { PRIORITIES, type Task, type TaskPriority } from '@/types/task'
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

export function getTaskStats(tasks: Task[]) {
  const completed = tasks.filter((task) => task.completed).length
  return { completed, active: tasks.length - completed }
}

/**
 * Applies search and filters, then sorts. Input is expected oldest-first (creation order),
 * which is what makes "newest"/"oldest" work without a timestamp on the task; the other
 * sorts use newest-first as a tie-breaker because `Array.prototype.sort` is stable.
 */
export function getVisibleTasks(tasks: Task[], view: TaskView): Task[] {
  const query = view.query.trim().toLowerCase()

  const filtered = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(query) &&
      (view.status === 'all' || task.completed === (view.status === 'completed')) &&
      (view.priority === 'all' || task.priority === view.priority),
  )

  if (view.sort === 'oldest') return filtered

  const newestFirst = filtered.toReversed()
  switch (view.sort) {
    case 'priority':
      return newestFirst.sort(
        (a, b) => PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority),
      )
    case 'dueDate':
      // Soonest first; tasks without a due date go last.
      return newestFirst.sort((a, b) => {
        if (a.dueDate === b.dueDate) return 0
        if (a.dueDate === undefined) return 1
        if (b.dueDate === undefined) return -1
        return a.dueDate < b.dueDate ? -1 : 1
      })
    default:
      return newestFirst
  }
}
