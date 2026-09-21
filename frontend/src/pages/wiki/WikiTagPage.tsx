import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { ErrorNotice } from '@/components/ErrorNotice'
import { ArticleList } from '@/components/wiki/ArticleList'
import { useArticleList } from '@/hooks/useArticles'

/** `/wiki/tags/:tag` — every article carrying one tag (the backend filters, newest update first). */
export function WikiTagPage() {
  const { t } = useTranslation()
  const { tag = '' } = useParams()
  const list = useArticleList({ tag })

  if (list.status === 'error') return <ErrorNotice error={list.error} onRetry={list.reload} />
  // A new tag never shows the previous tag's articles while its own are loading.
  if (list.data === undefined || list.isStale) return null

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

      {list.data.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">{t('wiki.tag.empty')}</p>
      ) : (
        <ArticleList articles={list.data} />
      )}
    </div>
  )
}
