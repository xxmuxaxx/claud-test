import { useTranslation } from 'react-i18next'
import { GamePageLayout } from '@/components/games/GamePageLayout'
import { SnakeGame } from '@/components/games/SnakeGame'

export function SnakePage() {
  const { t } = useTranslation()

  return (
    <GamePageLayout title={t('games.snake.title')}>
      <SnakeGame />
    </GamePageLayout>
  )
}
