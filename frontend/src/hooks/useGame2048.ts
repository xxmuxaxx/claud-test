import { useCallback, useReducer } from 'react'
import { continueGame, createGame, INITIAL_TILES, move } from '@/lib/game2048'
import type { Game2048State } from '@/types/game2048'
import type { Direction } from '@/types/snake'

// Spawning a tile draws two random numbers (which cell, 2 or 4). The reducer must stay pure (React
// may run it twice), so the numbers arrive inside the action.
type Action =
  | { type: 'move'; direction: Direction; randoms: number[] }
  | { type: 'continue' }
  | { type: 'restart'; randoms: number[] }

/** A `random()` that replays the given numbers in order. */
function fromValues(values: number[]) {
  let next = 0
  return () => values[next++] ?? 0
}

function reducer(state: Game2048State, action: Action): Game2048State {
  switch (action.type) {
    case 'move':
      return move(state, action.direction, fromValues(action.randoms))
    case 'continue':
      return continueGame(state)
    case 'restart':
      return createGame(fromValues(action.randoms), state.size)
  }
}

const rolls = (count: number) => Array.from({ length: count }, () => Math.random())

export function useGame2048() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createGame())

  return {
    state,
    move: useCallback(
      (direction: Direction) => dispatch({ type: 'move', direction, randoms: rolls(2) }),
      [],
    ),
    continueGame: useCallback(() => dispatch({ type: 'continue' }), []),
    restart: useCallback(
      () => dispatch({ type: 'restart', randoms: rolls(2 * INITIAL_TILES) }),
      [],
    ),
  }
}
