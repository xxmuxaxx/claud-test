import { SnakePreview } from '@/components/games/SnakePreview'
import type { GameDefinition } from '@/types/game'
import { SnakePage } from './SnakePage'

/**
 * The single list of games: the catalog page and the router are both built from it. Adding a game
 * means its own logic in `lib/`, components in `components/games/`, a page here, and one entry below.
 */
export const games: GameDefinition[] = [
  {
    id: 'snake',
    titleKey: 'games.snake.title',
    descriptionKey: 'games.snake.description',
    Preview: SnakePreview,
    Page: SnakePage,
  },
]
