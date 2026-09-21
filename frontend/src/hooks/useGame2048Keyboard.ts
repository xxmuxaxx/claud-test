import { useEffect } from 'react'
import { isEditable } from '@/lib/keyboard'
import { KEY_DIRECTIONS } from '@/lib/snake'
import type { Direction } from '@/types/snake'

/** Arrows and W/A/S/D slide the tiles. Active while the game is mounted. */
export function useGame2048Keyboard(onDirection: (direction: Direction) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return

      const direction = KEY_DIRECTIONS[event.code]
      if (direction) {
        event.preventDefault() // Arrows would otherwise scroll the page.
        onDirection(direction)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDirection])
}
