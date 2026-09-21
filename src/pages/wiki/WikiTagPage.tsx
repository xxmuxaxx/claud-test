import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { ArticleList } from '@/components/wiki/ArticleList'
import { filterByTag, sortByUpdated } from '@/lib/wiki'
import { useWikiStore } from '@/store/useWikiStore'

/** `/wiki/tags/:tag` — every article carrying one tag. */
export function WikiTagPage() {
  const { t } = useTranslation()
  const { tag = '' } = useParams()
  const { articles, status } = useWikiStore()
  const tagged = useMemo(() => sortByUpdated(filterByTag(articles, tag)), [articles, tag])

  if (status !== 'ready') return null

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          to="/wiki"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('wiki.tag.back')}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight break-words">
          {t('wiki.tag.heading', { tag })}
        </h1>
      </header>

      {tagged.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">{t('wiki.tag.empty')}</p>
      ) : (
        <ArticleList articles={tagged} />
      )}
    </div>
  )
}
