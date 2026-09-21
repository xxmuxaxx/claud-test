import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorNotice } from '@/components/ErrorNotice'
import { DeleteConfirmation } from '@/components/tasks/DeleteConfirmation'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TasksHeader } from '@/components/tasks/TasksHeader'
import { TasksList } from '@/components/tasks/TasksList'
import { TasksSkeleton } from '@/components/tasks/TasksSkeleton'
import { TasksToolbar } from '@/components/tasks/TasksToolbar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { DEFAULT_TASK_VIEW } from '@/lib/taskView'
import { useTasksStore } from '@/store/useTasksStore'
import type { Task, TaskInput } from '@/types/task'

type Dialog = { type: 'create' } | { type: 'edit'; task: Task } | { type: 'delete'; task: Task }

export function TasksPage() {
  const { t } = useTranslation()
  const {
    tasks,
    stats,
    status,
    refreshing,
    error,
    load,
    addTask,
    updateTask,
    toggleTask,
    removeTask,
  } = useTasksStore()
  const [view, setView] = useState(DEFAULT_TASK_VIEW)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [actionError, setActionError] = useState<unknown>(null)
  // A change is being sent: the buttons of the open dialog show a spinner and stay disabled.
  const [pending, setPending] = useState(false)

  // Typing in the search box is sent to the backend after a short pause; filters and sorting
  // apply at once.
  const query = useDebouncedValue(view.query)
  const { status: statusFilter, priority, sort } = view
  const requestedView = useMemo(
    () => ({ query, status: statusFilter, priority, sort }),
    [query, statusFilter, priority, sort],
  )
  useEffect(() => {
    void load(requestedView)
  }, [load, requestedView])

  const closeDialog = () => {
    setDialog(null)
    setActionError(null)
  }

  /** Runs a change; on failure the error is shown and the dialog (with the typed data) stays open. */
  async function perform(action: () => Promise<void>, { closesDialog = true } = {}) {
    setActionError(null)
    setPending(true)
    try {
      await action()
      if (closesDialog) closeDialog()
    } catch (failure) {
      setActionError(failure)
    } finally {
      setPending(false)
    }
  }

  const handleSubmit = (input: TaskInput) =>
    perform(() => (dialog?.type === 'edit' ? updateTask(dialog.task.id, input) : addTask(input)))

  const handleDelete = (task: Task) => perform(() => removeTask(task.id))

  const dialogError =
    actionError !== null && dialog !== null ? (
      <div className="mb-4">
        <ErrorNotice error={actionError} />
      </div>
    ) : null

  return (
    <div className="space-y-6">
      <TasksHeader
        completed={stats.completed}
        active={stats.active}
        onAdd={() => setDialog({ type: 'create' })}
      />

      {actionError !== null && dialog === null && <ErrorNotice error={actionError} />}

      {status === 'error' && <ErrorNotice error={error} onRetry={() => void load(requestedView)} />}

      {(status === 'idle' || status === 'loading') && <TasksSkeleton />}

      {status === 'ready' &&
        (stats.total === 0 ? (
          <div className="space-y-4 rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
            <div className="space-y-1">
              <p className="text-lg font-semibold">{t('tasks.empty.title')}</p>
              <p className="text-slate-500 dark:text-slate-400">{t('tasks.empty.hint')}</p>
            </div>
            <Button onClick={() => setDialog({ type: 'create' })}>{t('tasks.add')}</Button>
          </div>
        ) : (
          <>
            <TasksToolbar view={view} onChange={setView} />
            <TasksList
              tasks={tasks}
              busy={refreshing}
              onToggle={(id) => void perform(() => toggleTask(id), { closesDialog: false })}
              onEdit={(task) => setDialog({ type: 'edit', task })}
              onDelete={(task) => setDialog({ type: 'delete', task })}
            />
          </>
        ))}

      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <Modal
          title={dialog.type === 'edit' ? t('tasks.form.editTitle') : t('tasks.form.createTitle')}
          onClose={closeDialog}
        >
          {dialogError}
          <TaskForm
            task={dialog.type === 'edit' ? dialog.task : undefined}
            submitting={pending}
            onSubmit={(input) => void handleSubmit(input)}
            onCancel={closeDialog}
          />
        </Modal>
      )}

      {dialog?.type === 'delete' && (
        <DeleteConfirmation
          task={dialog.task}
          error={dialogError}
          deleting={pending}
          onConfirm={() => void handleDelete(dialog.task)}
          onCancel={closeDialog}
        />
      )}
    </div>
  )
}
