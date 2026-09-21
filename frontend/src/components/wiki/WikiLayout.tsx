import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { Menu, Plus, X } from 'lucide-react'
import { ErrorNotice } from '@/components/ErrorNotice'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useWikiStore } from '@/store/useWikiStore'
import type { WikiOutletContext } from './wikiOutletContext'
import { WikiSidebar } from './WikiSidebar'

/** Sidebar + content on desktop; a top bar with a slide-out menu on tablet and mobile. */
export function WikiLayout() {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()
  const { load, refresh, status, error } = useWikiStore()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    void load()
  }, [load])

  const context: WikiOutletContext = { query, setQuery }

  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      {isDesktop ? (
        <aside className="self-start lg:sticky lg:top-8">
          <WikiSidebar query={query} onQueryChange={setQuery} />
        </aside>
      ) : (
        <div className="mb-8 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger
              aria-label={t('wiki.openMenu')}
              className="-ml-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-lg font-bold tracking-tight hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="size-5" aria-hidden />
              {t('wiki.title')}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-white p-5 text-slate-900 shadow-xl outline-none dark:bg-slate-900 dark:text-slate-100"
              >
                <Dialog.Title className="sr-only">{t('wiki.navLabel')}</Dialog.Title>
                <Dialog.Close
                  aria-label={t('wiki.closeMenu')}
                  className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
                <WikiSidebar
                  query={query}
                  onQueryChange={setQuery}
                  showSearch={false}
                  onNavigate={() => setMenuOpen(false)}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Link
            to="/wiki/new"
            aria-label={t('wiki.create')}
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30"
          >
            <Plus className="size-5" aria-hidden />
          </Link>
        </div>
      )}

      <div className="min-w-0">
        {status === 'error' ? (
          <ErrorNotice error={error} onRetry={() => void refresh()} />
        ) : (
          <Outlet context={context} />
        )}
      </div>
    </div>
  )
}
