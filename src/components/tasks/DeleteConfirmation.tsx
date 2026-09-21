import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Task } from '@/types/task'

interface DeleteConfirmationProps {
  task: Task
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmation({ task, onConfirm, onCancel }: DeleteConfirmationProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('tasks.delete.title')}
      description={t('tasks.delete.subject', { title: task.title })}
      onClose={onCancel}
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('tasks.delete.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
