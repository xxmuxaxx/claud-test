import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useMatch, useNavigate } from 'react-router'
import { BookOpen, Plus, Search } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonClass'
import { fieldClass } from '@/components/ui/fieldClass'
import { cn } from '@/lib/cn'
import { getTagCounts, tagPath } from '@/lib/wiki'
import { useWikiStore } from '@/store/useWikiStore'

interface WikiSidebarProps {
  query: string
  onQueryChange: (query: string) => void
  /** Show the quick-search field (the narrow layout relies on the field on the index page). */
  showSearch?: boolean
  /** Called after any navigation from the sidebar, e.g. to close the mobile drawer. */
  onNavigate?: () => void
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm transition',
    isActive
      ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  )

const countClass = 'text-xs text-slate-400 tabular-nums dark:text-slate-500'

export function WikiSidebar({
  query,
  onQueryChange,
  showSearch = true,
  onNavigate,
}: WikiSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isIndex = useMatch({ path: '/wiki', end: true }) !== null
  const articles = useWikiStore((state) => state.articles)
  const tagCounts = useMemo(() => getTagCounts(articles), [articles])

  function handleQueryChange(value: string) {
    onQueryChange(value)
    // Results are shown on the index page, so searching from elsewhere leads there.
    if (!isIndex) void navigate('/wiki')
  }

  return (
    <nav aria-label={t('wiki.navLabel')} className="space-y-6">
      <Link
        to="/wiki"
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 text-lg font-bold tracking-tight"
      >
        <BookOpen className="size-5 text-brand-600 dark:text-brand-400" aria-hidden />
        {t('wiki.title')}
      </Link>

      {showSearch && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder={t('wiki.search.sidebarPlaceholder')}
            aria-label={t('wiki.search.sidebarLabel')}
            className={cn(fieldClass, 'pl-9')}
          />
        </div>
      )}

      <ul className="space-y-1">
        <li>
          <NavLink to="/wiki" end onClick={onNavigate} className={itemClass}>
            {t('wiki.allArticles')}
            <span className={countClass}>{articles.length}</span>
          </NavLink>
        </li>
      </ul>

      {tagCounts.length > 0 && (
        <div className="space-y-2">
          <h2 className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            {t('wiki.tags')}
          </h2>
          <ul className="space-y-1">
            {tagCounts.map(({ tag, count }) => (
              <li key={tag}>
                <NavLink to={tagPath(tag)} onClick={onNavigate} className={itemClass}>
                  <span className="min-w-0 truncate">#{tag}</span>
                  <span className={countClass}>{count}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
        <Link to="/wiki/new" onClick={onNavigate} className={buttonClass('primary', 'w-full')}>
          <Plus className="size-4" aria-hidden />
          {t('wiki.create')}
        </Link>
      </div>
    </nav>
  )
}
