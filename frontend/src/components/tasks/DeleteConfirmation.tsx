import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Task } from '@/types/task'

interface DeleteConfirmationProps {
  task: Task
  /** Shown above the buttons when deleting failed. */
  error?: ReactNode
  /** The deletion is being sent: the confirm button shows a spinner. */
  deleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmation({
  task,
  error,
  deleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('tasks.delete.title')}
      description={t('tasks.delete.subject', { title: task.title })}
      onClose={onCancel}
    >
      {error}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" loading={deleting} onClick={onConfirm}>
          {t('tasks.delete.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
