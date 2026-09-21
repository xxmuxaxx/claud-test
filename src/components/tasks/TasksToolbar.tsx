import { fieldClass } from '@/components/ui/fieldClass'
import { cn } from '@/lib/cn'
import type { PriorityFilter, SortOption, StatusFilter, TaskView } from '@/lib/taskView'
import { PRIORITIES, PRIORITY_LABELS } from '@/types/task'

interface TasksToolbarProps {
  view: TaskView
  onChange: (view: TaskView) => void
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Выполненные' },
]

const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'Все приоритеты' },
  ...PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] })),
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Новые сначала' },
  { value: 'oldest', label: 'Старые сначала' },
  { value: 'priority', label: 'По приоритету' },
  { value: 'dueDate', label: 'По сроку выполнения' },
]

export function TasksToolbar({ view, onChange }: TasksToolbarProps) {
  return (
    <div className="space-y-3">
      <input
        type="search"
        value={view.query}
        onChange={(event) => onChange({ ...view, query: event.target.value })}
        placeholder="Поиск дел..."
        aria-label="Поиск дел"
        className={fieldClass}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Статус"
          className="flex w-full rounded-lg bg-slate-100 p-1 sm:inline-flex sm:w-auto dark:bg-slate-800"
        >
          {statusOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view.status === value}
              onClick={() => onChange({ ...view, status: value })}
              className={cn(
                'flex-1 rounded-md px-3 py-1 text-sm font-medium transition sm:flex-none',
                view.status === value
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          aria-label="Фильтр по приоритету"
          value={view.priority}
          onChange={(event) =>
            onChange({ ...view, priority: event.target.value as PriorityFilter })
          }
          className={cn(fieldClass, 'w-auto min-w-36 flex-1 sm:flex-none')}
        >
          {priorityOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          aria-label="Сортировка"
          value={view.sort}
          onChange={(event) => onChange({ ...view, sort: event.target.value as SortOption })}
          className={cn(fieldClass, 'w-auto min-w-36 flex-1 sm:ml-auto sm:flex-none')}
        >
          {sortOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
