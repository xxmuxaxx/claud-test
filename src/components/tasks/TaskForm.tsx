import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/fieldClass'
import {
  PRIORITIES,
  PRIORITY_LABELS,
  type Task,
  type TaskInput,
  type TaskPriority,
} from '@/types/task'

interface TaskFormProps {
  /** When provided the form edits this task, otherwise it creates a new one. */
  task?: Task
  onSubmit: (input: TaskInput) => void
  onCancel: () => void
}

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [titleError, setTitleError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('Введите название')
      return
    }
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="task-title" className="text-sm font-medium">
          Название
        </label>
        <input
          id="task-title"
          maxLength={120}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setTitleError(null)
          }}
          aria-invalid={titleError !== null}
          aria-describedby={titleError ? 'task-title-error' : undefined}
          className={fieldClass}
        />
        {titleError && (
          <p id="task-title-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {titleError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-description" className="text-sm font-medium">
          Описание
        </label>
        <textarea
          id="task-description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="task-priority" className="text-sm font-medium">
            Приоритет
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className={fieldClass}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-due-date" className="text-sm font-medium">
            Дата выполнения
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit">{task ? 'Сохранить' : 'Создать'}</Button>
      </div>
    </form>
  )
}
