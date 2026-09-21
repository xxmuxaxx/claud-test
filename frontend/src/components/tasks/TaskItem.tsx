import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { formatDueDate } from '@/lib/dates'
import { isOverdue } from '@/lib/taskView'
import type { Task, TaskPriority } from '@/types/task'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
}

const iconButtonClass =
  'rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-slate-800 dark:hover:text-slate-200'

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const { t, i18n } = useTranslation()
  const overdue = isOverdue(task)

  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={task.title}
        className="mt-1 size-4 shrink-0 cursor-pointer accent-brand-600"
      />

      <div className="min-w-0 flex-1 space-y-1.5">
        <p
          className={cn(
            'font-medium break-words',
            task.completed && 'text-slate-400 line-through dark:text-slate-500',
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="line-clamp-2 text-sm break-words text-slate-500 dark:text-slate-400">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span
            className={cn('rounded-full px-2 py-0.5 font-medium', priorityStyles[task.priority])}
          >
            {t(`priority.${task.priority}`)}
          </span>
          {task.dueDate && (
            <span
              className={
                overdue
                  ? 'font-medium text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {t('tasks.item.due', { date: formatDueDate(task.dueDate, i18n.language) })}
              {overdue && ` · ${t('tasks.item.overdue')}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={t('tasks.item.edit', { title: task.title })}
          className={iconButtonClass}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={t('tasks.item.delete', { title: task.title })}
          className={cn(iconButtonClass, 'hover:text-red-600 dark:hover:text-red-400')}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
