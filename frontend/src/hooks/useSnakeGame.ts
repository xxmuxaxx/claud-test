import { useCallback, useEffect, useReducer } from 'react'
import { createGame, getTickInterval, startGame, step, togglePause, turn } from '@/lib/snake'
import type { Direction, SnakeState } from '@/types/snake'

// The reducer must stay pure (React may run it twice), so randomness arrives inside the action.
type Action =
  | { type: 'tick'; random: number }
  | { type: 'steer'; direction: Direction }
  | { type: 'start' }
  | { type: 'togglePause' }
  | { type: 'pause' }
  | { type: 'restart'; random: number }

function reducer(state: SnakeState, action: Action): SnakeState {
  switch (action.type) {
    case 'tick':
      return step(state, () => action.random)
    case 'steer':
      // A direction key on the start screen begins the game, like the Start button.
      return turn(startGame(state), action.direction)
    case 'start':
      return startGame(state)
    case 'togglePause':
      return togglePause(state)
    case 'pause':
      return state.status === 'running' ? togglePause(state) : state
    case 'restart':
      return startGame(createGame(() => action.random, state.size))
  }
}

/** Snake state plus the game loop: a `setInterval` that runs only while the game is running. */
export function useSnakeGame() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createGame())
  const running = state.status === 'running'
  const tickInterval = getTickInterval(state.score)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(
      () => dispatch({ type: 'tick', random: Math.random() }),
      tickInterval,
    )
    return () => window.clearInterval(id)
  }, [running, tickInterval])

  // Don't let the snake crash while the tab is in the background.
  useEffect(() => {
    const onVisibilityChange = () => document.hidden && dispatch({ type: 'pause' })
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return {
    state,
    start: useCallback(() => dispatch({ type: 'start' }), []),
    steer: useCallback((direction: Direction) => dispatch({ type: 'steer', direction }), []),
    togglePause: useCallback(() => dispatch({ type: 'togglePause' }), []),
    restart: useCallback(() => dispatch({ type: 'restart', random: Math.random() }), []),
  }
}
