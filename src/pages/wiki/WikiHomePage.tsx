import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonClass'
import { fieldClass } from '@/components/ui/fieldClass'
import { ArticleList } from '@/components/wiki/ArticleList'
import { CompactArticleList } from '@/components/wiki/CompactArticleList'
import { WikiEmptyState } from '@/components/wiki/WikiEmptyState'
import { useWikiOutletContext } from '@/components/wiki/wikiOutletContext'
import { cn } from '@/lib/cn'
import { filterByTag, getTagCounts, searchArticles, sortByCreated, sortByUpdated } from '@/lib/wiki'
import { useWikiStore } from '@/store/useWikiStore'

/** "Recently changed / created" blocks only earn their place once the wiki has some volume. */
const RECENT_MIN_ARTICLES = 4
const RECENT_COUNT = 5

const chipClass = (active: boolean) =>
  cn(
    'rounded-full px-3 py-1 text-sm font-medium transition',
    active
      ? 'bg-brand-600 text-white'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
  )

export function WikiHomePage() {
  const { t } = useTranslation()
  const { query, setQuery } = useWikiOutletContext()
  const { articles, status } = useWikiStore()
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const tagCounts = useMemo(() => getTagCounts(articles), [articles])
  const isFiltering = query.trim() !== '' || activeTag !== null
  const results = useMemo(() => {
    const pool = activeTag ? filterByTag(articles, activeTag) : articles
    return searchArticles(pool, query)
  }, [articles, activeTag, query])

  if (status !== 'ready') return null

  const isEmpty = articles.length === 0

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">{t('wiki.title')}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">{t('wiki.tagline')}</p>
          {!isEmpty && (
            <p className="pt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('wiki.stats', { articles: articles.length, tags: tagCounts.length })}
            </p>
          )}
        </div>
        {!isEmpty && (
          <Link to="/wiki/new" className={buttonClass()}>
            <Plus className="size-4" aria-hidden />
            {t('wiki.create')}
          </Link>
        )}
      </header>

      {isEmpty ? (
        <WikiEmptyState />
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('wiki.search.placeholder')}
              aria-label={t('wiki.search.label')}
              className={cn(fieldClass, 'py-3.5 pl-12 text-base')}
            />
          </div>

          {tagCounts.length > 0 && (
            <div role="group" aria-label={t('wiki.tagFilter')} className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={activeTag === null}
                onClick={() => setActiveTag(null)}
                className={chipClass(activeTag === null)}
              >
                {t('wiki.allTags')}
              </button>
              {tagCounts.map(({ tag }) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={activeTag === tag}
                  onClick={() => setActiveTag(tag)}
                  className={chipClass(activeTag === tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {!isFiltering && articles.length >= RECENT_MIN_ARTICLES && (
            <div className="grid gap-8 md:grid-cols-2">
              <section className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {t('wiki.recentlyUpdated')}
                </h2>
                <CompactArticleList
                  articles={sortByUpdated(articles).slice(0, RECENT_COUNT)}
                  dateField="updatedAt"
                />
              </section>
              <section className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {t('wiki.recentlyCreated')}
                </h2>
                <CompactArticleList
                  articles={sortByCreated(articles).slice(0, RECENT_COUNT)}
                  dateField="createdAt"
                />
              </section>
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {isFiltering ? t('wiki.results') : t('wiki.allArticles')}
            </h2>
            <ArticleList articles={results} />
          </section>
        </>
      )}
    </div>
  )
}
