import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Task } from '@/types/task'

interface DeleteConfirmationProps {
  task: Task
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmation({ task, onConfirm, onCancel }: DeleteConfirmationProps) {
  return (
    <Modal title="Удалить дело?" description={`«${task.title}»`} onClose={onCancel}>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Удалить
        </Button>
      </div>
    </Modal>
  )
}
