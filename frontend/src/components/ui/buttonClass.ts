import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

export type ButtonVariant = NonNullable<VariantProps<typeof button>['variant']>

/** Button look, shared with links that should look like buttons. */
export function buttonClass(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(button({ variant }), className)
}
