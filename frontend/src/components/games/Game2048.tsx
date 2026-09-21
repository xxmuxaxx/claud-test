import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useGame2048 } from '@/hooks/useGame2048'
import { useGame2048Keyboard } from '@/hooks/useGame2048Keyboard'
import { useHighScore } from '@/hooks/useHighScore'
import { HIGH_SCORE_STORAGE_KEY } from '@/lib/game2048'
import { Game2048Board } from './Game2048Board'
import { ScoreBoard } from './ScoreBoard'

export function Game2048() {
  const { t } = useTranslation()
  const { state, move, continueGame, restart } = useGame2048()
  const { status, score, size, tiles } = state
  const highScore = useHighScore(HIGH_SCORE_STORAGE_KEY, score)

  useGame2048Keyboard(move)

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <ScoreBoard score={score} highScore={highScore} />

      <div className="relative">
        <Game2048Board size={size} tiles={tiles} onMove={move} />
        {status !== 'running' && (
          <div
            aria-live="polite"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 p-4 text-center backdrop-blur-sm dark:bg-slate-900/85"
          >
            <p className="text-2xl font-bold">
              {status === 'won' ? t('games.2048.won') : t('games.2048.gameOver')}
            </p>
            <p className="text-lg">{t('games.2048.finalScore', { score })}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {status === 'won' && (
                <Button onClick={continueGame} autoFocus>
                  {t('games.2048.continue')}
                </Button>
              )}
              <Button variant={status === 'won' ? 'secondary' : 'primary'} onClick={restart}>
                {t('games.2048.restart')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button variant="secondary" onClick={restart}>
          {t('games.2048.newGame')}
        </Button>
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        <span className="hidden pointer-fine:md:inline">{t('games.2048.keysHint')}</span>
        <span className="pointer-fine:md:hidden">{t('games.2048.swipeHint')}</span>
      </p>
    </div>
  )
}
