import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { Point, SnakeState } from '@/types/snake'

function Cell({
  point,
  size,
  kind,
}: {
  point: Point
  size: number
  kind: 'head' | 'body' | 'food'
}) {
  const cell = 100 / size

  return (
    <div
      data-cell={kind}
      className={cn(
        'absolute border border-transparent bg-clip-padding',
        kind === 'food' && 'rounded-full bg-red-500',
        kind === 'body' && 'rounded-sm bg-brand-500',
        kind === 'head' && 'rounded-md bg-brand-700 dark:bg-brand-300',
      )}
      style={{
        left: `${point.x * cell}%`,
        top: `${point.y * cell}%`,
        width: `${cell}%`,
        height: `${cell}%`,
      }}
    />
  )
}

/** Square field that scales with its container; segments are positioned in percent of the board. */
export function SnakeBoard({ state }: { state: SnakeState }) {
  const { t } = useTranslation()
  const { size, snake, food } = state
  const line = 'rgb(148 163 184 / 0.25)'

  return (
    <div
      role="img"
      aria-label={t('games.snake.board')}
      className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={{
        backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: `${100 / size}% ${100 / size}%`,
      }}
    >
      {food && <Cell point={food} size={size} kind="food" />}
      {snake.map((point, index) => (
        <Cell
          key={`${point.x},${point.y}`}
          point={point}
          size={size}
          kind={index === 0 ? 'head' : 'body'}
        />
      ))}
    </div>
  )
}
