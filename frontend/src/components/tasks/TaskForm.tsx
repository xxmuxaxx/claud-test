import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/fieldClass'
import { PRIORITIES, type Task, type TaskInput, type TaskPriority } from '@/types/task'

interface TaskFormProps {
  /** When provided the form edits this task, otherwise it creates a new one. */
  task?: Task
  /** The change is being sent: the submit button shows a spinner. */
  submitting?: boolean
  onSubmit: (input: TaskInput) => void
  onCancel: () => void
}

export function TaskForm({ task, submitting = false, onSubmit, onCancel }: TaskFormProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [titleInvalid, setTitleInvalid] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleInvalid(true)
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
          {t('tasks.form.titleField')}
        </label>
        <input
          id="task-title"
          maxLength={120}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setTitleInvalid(false)
          }}
          aria-invalid={titleInvalid}
          aria-describedby={titleInvalid ? 'task-title-error' : undefined}
          className={fieldClass}
        />
        {titleInvalid && (
          <p id="task-title-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {t('tasks.form.titleRequired')}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-description" className="text-sm font-medium">
          {t('tasks.form.descriptionField')}
        </label>
        <textarea
          id="task-description"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="task-priority" className="text-sm font-medium">
            {t('tasks.form.priorityField')}
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className={fieldClass}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {t(`priority.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-due-date" className="text-sm font-medium">
            {t('tasks.form.dueDateField')}
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
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={submitting}>
          {task ? t('tasks.form.save') : t('tasks.form.create')}
        </Button>
      </div>
    </form>
  )
}
