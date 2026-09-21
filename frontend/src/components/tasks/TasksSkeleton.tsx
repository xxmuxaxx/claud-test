import { LoadingRegion } from '@/components/ui/LoadingRegion'
import { Skeleton } from '@/components/ui/Skeleton'

/** Placeholder for the toolbar and task rows while the first page of tasks loads. */
export function TasksSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <LoadingRegion>
      <div className="space-y-6">
        <Skeleton className="h-10 rounded-lg" />
        <ul className="space-y-3">
          {Array.from({ length: rows }, (_, index) => (
            <li
              key={index}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Skeleton className="mt-1 size-4 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </LoadingRegion>
  )
}
