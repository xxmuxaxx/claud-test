import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { swipeDirection } from '@/lib/game2048'
import type { Tile } from '@/types/game2048'
import type { Direction } from '@/types/snake'

// Full class names, so Tailwind can see them. Anything above 2048 shares the last entry.
const TILE_STYLES: Record<number, string> = {
  2: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  4: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  8: 'bg-orange-300 text-orange-950 dark:bg-orange-700 dark:text-white',
  16: 'bg-orange-400 text-white dark:bg-orange-600',
  32: 'bg-red-400 text-white dark:bg-red-600',
  64: 'bg-red-500 text-white dark:bg-red-700',
  128: 'bg-yellow-300 text-yellow-950 dark:bg-yellow-500',
  256: 'bg-yellow-400 text-yellow-950 dark:bg-yellow-500',
  512: 'bg-yellow-500 text-white dark:bg-yellow-600',
  1024: 'bg-lime-500 text-white dark:bg-lime-600',
  2048: 'bg-brand-500 text-white dark:bg-brand-400 dark:text-brand-900',
}
const HUGE_TILE_STYLE = 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'

/** Longer numbers get smaller type so that they fit the tile. */
function fontSize(value: number) {
  const digits = String(value).length
  if (digits <= 2) return 'text-2xl sm:text-3xl'
  if (digits === 3) return 'text-xl sm:text-2xl'
  if (digits === 4) return 'text-lg sm:text-xl'
  return 'text-sm sm:text-base'
}

/** The gap between cells; the tiles' geometry below is derived from it. */
const GAP = '0.5rem'

interface Game2048BoardProps {
  size: number
  tiles: Tile[]
  onMove: (direction: Direction) => void
}

/**
 * The empty cells are a static backdrop; the tiles float above it, each positioned with a
 * `transform` that CSS transitions. A tile keeps its DOM element between moves (React key = tile
 * id), so a changed cell means a slide. New and merged tiles pop in once the slide has finished
 * (see `--animate-tile-*` in `index.css`). Also reads touch swipes, since a phone has no arrow keys.
 */
export function Game2048Board({ size, tiles, onMove }: Game2048BoardProps) {
  const { t } = useTranslation()
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (event: PointerEvent) => {
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event: PointerEvent) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y)
    if (direction) onMove(direction)
  }

  return (
    <div
      // `touch-none` keeps the page from scrolling while the player swipes over the board.
      className="aspect-square w-full touch-none rounded-xl bg-slate-300 p-2 select-none dark:bg-slate-800"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipeStart.current = null)}
    >
      <div className="relative size-full">
        <div
          aria-hidden="true"
          className="grid size-full"
          style={{
            gap: GAP,
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
          }}
        >
          {Array.from({ length: size * size }, (_, i) => (
            <div key={i} className="rounded-md bg-slate-200/60 dark:bg-slate-900/60" />
          ))}
        </div>

        <ul aria-label={t('games.2048.board')} className="absolute inset-0">
          {tiles.map((tile) => (
            <li
              key={tile.id}
              // A consumed tile is only a visual: the merged tile on top of it is the real one.
              aria-hidden={tile.consumed || undefined}
              aria-label={t('games.2048.tile', {
                value: tile.value,
                row: tile.y + 1,
                column: tile.x + 1,
              })}
              data-x={tile.x}
              data-y={tile.y}
              className={cn(
                'absolute top-0 left-0 transition-transform duration-100 ease-in-out motion-reduce:transition-none',
                tile.consumed ? 'z-0' : 'z-10',
              )}
              style={{
                width: `calc((100% - ${size - 1} * ${GAP}) / ${size})`,
                height: `calc((100% - ${size - 1} * ${GAP}) / ${size})`,
                transform: `translate(calc(${tile.x} * (100% + ${GAP})), calc(${tile.y} * (100% + ${GAP})))`,
              }}
            >
              <div
                className={cn(
                  'flex size-full items-center justify-center rounded-md font-bold tabular-nums',
                  TILE_STYLES[tile.value] ?? HUGE_TILE_STYLE,
                  fontSize(tile.value),
                  tile.isNew && 'animate-tile-appear motion-reduce:animate-none',
                  tile.merged && 'animate-tile-merge motion-reduce:animate-none',
                )}
              >
                {tile.value}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
