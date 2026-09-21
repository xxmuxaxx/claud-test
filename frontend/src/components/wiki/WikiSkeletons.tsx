import { LoadingRegion } from '@/components/ui/LoadingRegion'
import { Skeleton } from '@/components/ui/Skeleton'

/** Placeholder cards with the shape of `ArticleCard`. */
export function ArticleCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** The wiki index (search field + articles) or a tag page while its articles load. */
export function ArticleListPageSkeleton({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <LoadingRegion>
      <div className="space-y-8">
        {withSearch && <Skeleton className="h-14 rounded-lg" />}
        <ArticleCardsSkeleton />
      </div>
    </LoadingRegion>
  )
}

/** An article (or the editor for one) while it loads. */
export function ArticlePageSkeleton() {
  return (
    <LoadingRegion>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </LoadingRegion>
  )
}
