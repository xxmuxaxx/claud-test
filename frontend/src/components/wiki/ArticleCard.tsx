import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { formatRelativeDate } from '@/lib/dates'
import { getExcerpt } from '@/lib/wiki'
import type { WikiArticle } from '@/types/wiki'
import { TagList } from './TagList'

export function ArticleCard({ article }: { article: WikiArticle }) {
  const { t, i18n } = useTranslation()
  const excerpt = getExcerpt(article)

  return (
    <Link
      to={`/wiki/${article.id}`}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
    >
      <h3 className="text-lg font-semibold tracking-tight break-words group-hover:text-brand-600 dark:group-hover:text-brand-400">
        {article.title}
      </h3>
      {excerpt && (
        <p className="mt-1 line-clamp-2 text-sm break-words text-slate-600 dark:text-slate-400">
          {excerpt}
        </p>
      )}
      <TagList tags={article.tags} className="mt-4" />
      <p className="mt-auto pt-4 text-xs text-slate-500 dark:text-slate-400">
        {t('wiki.updated', { date: formatRelativeDate(article.updatedAt, i18n.language) })}
      </p>
    </Link>
  )
}
