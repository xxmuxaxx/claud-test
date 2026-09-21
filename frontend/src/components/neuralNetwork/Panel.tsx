import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps {
  title: string
  /** Something small on the right of the title, e.g. a checkbox. */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** The card every block of the lab lives in. */
export function Panel({ title, action, className, children }: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
