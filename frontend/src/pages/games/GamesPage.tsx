import { useTranslation } from 'react-i18next'
import { GameCard } from '@/components/games/GameCard'
import { games } from './catalog'

export function GamesPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('games.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400">{t('games.intro')}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {games.map((game) => (
          <li key={game.id}>
            <GameCard game={game} />
          </li>
        ))}
      </ul>
    </div>
  )
}
