import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { tagPath } from '@/lib/wiki'

const chipClass =
  'rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'

interface TagListProps {
  tags: readonly string[]
  /** Render tags as links to their tag page. Leave off inside another link (cards). */
  linked?: boolean
  className?: string
}

export function TagList({ tags, linked = false, className }: TagListProps) {
  if (tags.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <li key={tag}>
          {linked ? (
            <Link
              to={tagPath(tag)}
              className={cn(
                chipClass,
                'inline-block transition hover:bg-brand-100 dark:hover:bg-brand-900',
              )}
            >
              #{tag}
            </Link>
          ) : (
            <span className={chipClass}>#{tag}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
