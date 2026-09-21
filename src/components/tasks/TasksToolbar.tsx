import { useTranslation } from 'react-i18next'
import { fieldClass } from '@/components/ui/fieldClass'
import { cn } from '@/lib/cn'
import type { PriorityFilter, SortOption, StatusFilter, TaskView } from '@/lib/taskView'
import { PRIORITIES } from '@/types/task'

interface TasksToolbarProps {
  view: TaskView
  onChange: (view: TaskView) => void
}

const STATUS_FILTERS: readonly StatusFilter[] = ['all', 'active', 'completed']
const SORT_OPTIONS: readonly SortOption[] = ['newest', 'oldest', 'priority', 'dueDate']

export function TasksToolbar({ view, onChange }: TasksToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={view.query}
        onChange={(event) => onChange({ ...view, query: event.target.value })}
        placeholder={t('tasks.toolbar.searchPlaceholder')}
        aria-label={t('tasks.toolbar.searchLabel')}
        className={fieldClass}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label={t('tasks.toolbar.statusLabel')}
          className="flex w-full rounded-lg bg-slate-100 p-1 sm:inline-flex sm:w-auto dark:bg-slate-800"
        >
          {STATUS_FILTERS.map((value) => (
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
              {t(`tasks.toolbar.status.${value}`)}
            </button>
          ))}
        </div>

        <select
          aria-label={t('tasks.toolbar.priorityLabel')}
          value={view.priority}
          onChange={(event) =>
            onChange({ ...view, priority: event.target.value as PriorityFilter })
          }
          className={cn(fieldClass, 'w-auto min-w-36 flex-1 sm:flex-none')}
        >
          <option value="all">{t('tasks.toolbar.allPriorities')}</option>
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {t(`priority.${value}`)}
            </option>
          ))}
        </select>

        <select
          aria-label={t('tasks.toolbar.sortLabel')}
          value={view.sort}
          onChange={(event) => onChange({ ...view, sort: event.target.value as SortOption })}
          className={cn(fieldClass, 'w-auto min-w-36 flex-1 sm:ml-auto sm:flex-none')}
        >
          {SORT_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {t(`tasks.toolbar.sort.${value}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
