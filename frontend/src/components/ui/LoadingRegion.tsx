import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from './Spinner'

interface LoadingRegionProps {
  /** The placeholder shown meanwhile (skeletons); a centered spinner when omitted. */
  children?: ReactNode
}

/** Wraps a loading placeholder so that screen readers hear "Loading…" once. */
export function LoadingRegion({ children }: LoadingRegionProps) {
  const { t } = useTranslation()

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t('common.loading')}</span>
      {children ?? (
        <div className="flex justify-center py-16 text-slate-400 dark:text-slate-500">
          <Spinner className="size-8" />
        </div>
      )}
    </div>
  )
}
