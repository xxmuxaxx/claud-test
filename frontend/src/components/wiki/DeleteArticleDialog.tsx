import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface DeleteArticleDialogProps {
  /** Shown above the buttons when deleting failed. */
  error?: ReactNode
  /** The deletion is being sent: the confirm button shows a spinner. */
  deleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteArticleDialog({
  error,
  deleting = false,
  onConfirm,
  onCancel,
}: DeleteArticleDialogProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('wiki.delete.title')}
      description={t('wiki.delete.description')}
      onClose={onCancel}
    >
      {error}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" loading={deleting} onClick={onConfirm}>
          {t('wiki.delete.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
