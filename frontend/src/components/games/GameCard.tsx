import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/buttonClass'
import type { GameDefinition } from '@/types/game'

export function GameCard({ game }: { game: GameDefinition }) {
  const { t } = useTranslation()

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <game.Preview className="size-16 text-brand-600 dark:text-brand-400" />
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{t(game.titleKey)}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t(game.descriptionKey)}</p>
      <Link
        to={`/games/${game.id}`}
        aria-label={`${t('games.play')}: ${t(game.titleKey)}`}
        className={buttonClass('primary', 'mt-5 self-start')}
      >
        {t('games.play')}
      </Link>
    </article>
  )
}
