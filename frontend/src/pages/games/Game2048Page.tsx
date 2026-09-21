import { useTranslation } from 'react-i18next'
import { Game2048 } from '@/components/games/Game2048'
import { GamePageLayout } from '@/components/games/GamePageLayout'

export function Game2048Page() {
  const { t } = useTranslation()

  return (
    <GamePageLayout title={t('games.2048.title')}>
      <Game2048 />
    </GamePageLayout>
  )
}
