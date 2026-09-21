import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { errorMessageKey } from '@/lib/errors'

interface ErrorNoticeProps {
  error: unknown
  /** When given, a "Retry" button is shown. */
  onRetry?: () => void
}

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    >
      <span>{t(errorMessageKey(error))}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('errors.retry')}
        </Button>
      )}
    </div>
  )
}
