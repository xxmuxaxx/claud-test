import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** A grey placeholder block; size and shape come from `className`. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        'rounded-md bg-slate-200 motion-safe:animate-pulse dark:bg-slate-800',
        className,
      )}
      {...props}
    />
  )
}
