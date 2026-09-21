import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useHighScore } from '@/hooks/useHighScore'
import { useSnakeGame } from '@/hooks/useSnakeGame'
import { useSnakeKeyboard } from '@/hooks/useSnakeKeyboard'
import { HIGH_SCORE_STORAGE_KEY } from '@/lib/snake'
import { ScoreBoard } from './ScoreBoard'
import { SnakeBoard } from './SnakeBoard'
import { SnakeControls } from './SnakeControls'

export function SnakeGame() {
  const { t } = useTranslation()
  const { state, start, steer, togglePause, restart } = useSnakeGame()
  const { status, score } = state
  const highScore = useHighScore(HIGH_SCORE_STORAGE_KEY, score)

  useSnakeKeyboard({ onDirection: steer, onTogglePause: togglePause })

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <ScoreBoard score={score} highScore={highScore} />

      <div className="relative">
        <SnakeBoard state={state} />
        {status !== 'running' && (
          <div
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 p-4 text-center backdrop-blur-sm dark:bg-slate-900/85"
          >
            {status === 'idle' && (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('games.snake.startHint')}
                </p>
                <Button onClick={start}>{t('games.snake.start')}</Button>
              </>
            )}
            {status === 'paused' && <p className="text-2xl font-bold">{t('games.snake.paused')}</p>}
            {(status === 'over' || status === 'won') && (
              <>
                <p className="text-2xl font-bold">
                  {status === 'won' ? t('games.snake.won') : t('games.snake.gameOver')}
                </p>
                <p className="text-lg">{t('games.snake.finalScore', { score })}</p>
                <Button onClick={restart} autoFocus>
                  {t('games.snake.restart')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={togglePause}
          disabled={status !== 'running' && status !== 'paused'}
        >
          {status === 'paused' ? t('games.snake.resume') : t('games.snake.pause')}
        </Button>
      </div>

      <SnakeControls onDirection={steer} />

      <p className="hidden text-center text-sm text-slate-500 pointer-fine:md:block dark:text-slate-400">
        {t('games.snake.keysHint')}
      </p>
    </div>
  )
}
