import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

/** Frame shared by every game page: "back to games" link, the game's title, then the game itself. */
export function GamePageLayout({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <Link
        to="/games"
        className="inline-block text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        {t('games.back')}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}
