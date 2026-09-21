import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { formatRelativeDate } from '@/lib/dates'
import type { WikiArticle } from '@/types/wiki'

interface CompactArticleListProps {
  articles: readonly WikiArticle[]
  /** Which date to show next to each title; none by default. */
  dateField?: 'createdAt' | 'updatedAt'
}

/** One line per article: title and, optionally, how long ago it was created or updated. */
export function CompactArticleList({ articles, dateField }: CompactArticleListProps) {
  const { i18n } = useTranslation()

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            to={`/wiki/${article.id}`}
            className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <span className="min-w-0 truncate font-medium">{article.title}</span>
            {dateField && (
              <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                {formatRelativeDate(article[dateField], i18n.language)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
