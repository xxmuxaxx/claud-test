import { useEffect, useMemo, useState } from 'react'
import { DeleteConfirmation } from '@/components/tasks/DeleteConfirmation'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TasksHeader } from '@/components/tasks/TasksHeader'
import { TasksList } from '@/components/tasks/TasksList'
import { TasksToolbar } from '@/components/tasks/TasksToolbar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DEFAULT_TASK_VIEW, getTaskStats, getVisibleTasks } from '@/lib/taskView'
import { useTasksStore } from '@/store/useTasksStore'
import type { Task, TaskInput } from '@/types/task'

type Dialog = { type: 'create' } | { type: 'edit'; task: Task } | { type: 'delete'; task: Task }

export function TasksPage() {
  const { tasks, status, load, addTask, updateTask, toggleTask, removeTask } = useTasksStore()
  const [view, setView] = useState(DEFAULT_TASK_VIEW)
  const [dialog, setDialog] = useState<Dialog | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  const visibleTasks = useMemo(() => getVisibleTasks(tasks, view), [tasks, view])
  const { completed, active } = getTaskStats(tasks)
  const closeDialog = () => setDialog(null)

  async function handleSubmit(input: TaskInput) {
    if (dialog?.type === 'edit') {
      await updateTask(dialog.task.id, input)
    } else {
      await addTask(input)
    }
    closeDialog()
  }

  async function handleDelete(task: Task) {
    await removeTask(task.id)
    closeDialog()
  }

  return (
    <div className="space-y-6">
      <TasksHeader
        completed={completed}
        active={active}
        onAdd={() => setDialog({ type: 'create' })}
      />

      {status === 'ready' &&
        (tasks.length === 0 ? (
          <div className="space-y-4 rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Пока нет дел</p>
              <p className="text-slate-500 dark:text-slate-400">
                Создайте первое дело, чтобы начать.
              </p>
            </div>
            <Button onClick={() => setDialog({ type: 'create' })}>Добавить дело</Button>
          </div>
        ) : (
          <>
            <TasksToolbar view={view} onChange={setView} />
            <TasksList
              tasks={visibleTasks}
              onToggle={(id) => void toggleTask(id)}
              onEdit={(task) => setDialog({ type: 'edit', task })}
              onDelete={(task) => setDialog({ type: 'delete', task })}
            />
          </>
        ))}

      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <Modal
          title={dialog.type === 'edit' ? 'Редактирование дела' : 'Новое дело'}
          onClose={closeDialog}
        >
          <TaskForm
            task={dialog.type === 'edit' ? dialog.task : undefined}
            onSubmit={(input) => void handleSubmit(input)}
            onCancel={closeDialog}
          />
        </Modal>
      )}

      {dialog?.type === 'delete' && (
        <DeleteConfirmation
          task={dialog.task}
          onConfirm={() => void handleDelete(dialog.task)}
          onCancel={closeDialog}
        />
      )}
    </div>
  )
}
