import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { Direction } from '@/types/snake'

const ARROWS: Record<Direction, { icon: string; cell: string }> = {
  up: { icon: '↑', cell: 'col-start-2 row-start-1' },
  left: { icon: '←', cell: 'col-start-1 row-start-2' },
  right: { icon: '→', cell: 'col-start-3 row-start-2' },
  down: { icon: '↓', cell: 'col-start-2 row-start-3' },
}

/** On-screen D-pad. Hidden on wide screens with a mouse, where the keyboard is the natural input. */
export function SnakeControls({ onDirection }: { onDirection: (direction: Direction) => void }) {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('games.snake.controls.label')}
      className="mx-auto grid grid-cols-3 grid-rows-3 gap-2 pointer-fine:md:hidden"
    >
      {(Object.keys(ARROWS) as Direction[]).map((direction) => (
        <button
          key={direction}
          type="button"
          aria-label={t(`games.snake.controls.${direction}`)}
          onClick={() => onDirection(direction)}
          className={cn(
            'flex size-16 touch-manipulation items-center justify-center rounded-xl bg-slate-100 text-2xl font-semibold text-slate-700 select-none active:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:active:bg-slate-600',
            ARROWS[direction].cell,
          )}
        >
          {ARROWS[direction].icon}
        </button>
      ))}
    </div>
  )
}
