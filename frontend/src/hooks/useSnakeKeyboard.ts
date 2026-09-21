import { useEffect } from 'react'
import { isButtonLike, isEditable } from '@/lib/keyboard'
import { KEY_DIRECTIONS } from '@/lib/snake'
import type { Direction } from '@/types/snake'

interface SnakeKeyboardHandlers {
  onDirection: (direction: Direction) => void
  onTogglePause: () => void
}

/** Arrows and W/A/S/D steer; Space or P toggles pause. Active while the game is mounted. */
export function useSnakeKeyboard({ onDirection, onTogglePause }: SnakeKeyboardHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return

      const direction = KEY_DIRECTIONS[event.code]
      if (direction) {
        event.preventDefault() // Arrows would otherwise scroll the page.
        onDirection(direction)
      } else if (event.code === 'KeyP' || (event.code === 'Space' && !isButtonLike(event.target))) {
        // A focused button already turns Space into a click; handling it twice would cancel out.
        event.preventDefault()
        if (!event.repeat) onTogglePause()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDirection, onTogglePause])
}
