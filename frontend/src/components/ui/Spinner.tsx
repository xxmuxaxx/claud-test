import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Decorative spinning icon; whoever shows it announces the loading state (see `LoadingRegion`). */
export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={cn('size-4 motion-safe:animate-spin', className)} />
}
