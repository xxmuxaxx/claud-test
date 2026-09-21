import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const stepButton =
  'inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** A whole number changed with − and + buttons, kept between `min` and `max`. */
export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const { t } = useTranslation()

  return (
    <div role="group" aria-label={label} className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={stepButton}
          aria-label={t('common.decrease', { label })}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          className={stepButton}
          aria-label={t('common.increase', { label })}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  )
}
