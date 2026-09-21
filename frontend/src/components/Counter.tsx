import { useTranslation } from 'react-i18next'
import { useCounterStore } from '@/store/useCounterStore'

export function Counter() {
  const { t } = useTranslation()
  const { count, increment, decrement, reset } = useCounterStore()

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={decrement}
        className="rounded-lg bg-slate-100 px-3 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        aria-label={t('counter.decrement')}
      >
        -
      </button>
      <span className="min-w-12 text-center text-2xl font-bold tabular-nums">{count}</span>
      <button
        type="button"
        onClick={increment}
        className="rounded-lg bg-brand-600 px-3 py-2 text-lg font-semibold text-white transition hover:bg-brand-700"
        aria-label={t('counter.increment')}
      >
        +
      </button>
      <button
        type="button"
        onClick={reset}
        className="ml-2 text-sm font-medium text-slate-500 underline-offset-4 hover:underline dark:text-slate-400"
      >
        {t('counter.reset')}
      </button>
    </div>
  )
}
