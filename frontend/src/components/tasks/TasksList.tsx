import { useTranslation } from 'react-i18next'
import type { Task } from '@/types/task'
import { TaskItem } from './TaskItem'

interface TasksListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TasksList({ tasks, onToggle, onEdit, onDelete }: TasksListProps) {
  const { t } = useTranslation()

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {t('tasks.nothingFound')}
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
