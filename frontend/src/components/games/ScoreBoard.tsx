import { useTranslation } from 'react-i18next'

/** Current score and the saved record, shared by all games. */
export function ScoreBoard({ score, highScore }: { score: number; highScore: number }) {
  const { t } = useTranslation()

  return (
    <div className="flex justify-between gap-4 text-lg font-semibold tabular-nums">
      <p>{t('games.score', { score })}</p>
      <p className="text-slate-600 dark:text-slate-400">
        {t('games.highScore', { score: highScore })}
      </p>
    </div>
  )
}
