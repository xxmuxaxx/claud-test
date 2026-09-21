import type { Direction, Point, SnakeState } from '@/types/snake'

/** Pure Snake rules: no React, no timers, no globals. Randomness is passed in by the caller. */

export const BOARD_SIZE = 20
export const INITIAL_SNAKE_LENGTH = 3
export const INITIAL_DIRECTION: Direction = 'right'
export const POINTS_PER_FOOD = 1

/** Milliseconds per move at score 0, and the fastest allowed speed. */
export const START_TICK_MS = 140
export const MIN_TICK_MS = 70
/** How much each eaten food shortens the tick. */
export const TICK_STEP_MS = 3

/** Enough to buffer a quick "up, left" combo without letting a key mash pile up. */
export const MAX_QUEUED_TURNS = 2

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/** Keyed by `KeyboardEvent.code`, so W/A/S/D also work on a Russian or Georgian layout. */
export const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
}

export const HIGH_SCORE_STORAGE_KEY = 'games.snake.highScore'

type Random = () => number

const cellKey = ({ x, y }: Point) => `${x},${y}`

/** A random free cell, or `null` when the snake covers the whole board. */
export function placeFood(snake: Point[], size: number, random: Random): Point | null {
  const taken = new Set(snake.map(cellKey))
  const free: Point[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!taken.has(cellKey({ x, y }))) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.min(Math.floor(random() * free.length), free.length - 1)]
}

export function createGame(random: Random = Math.random, size: number = BOARD_SIZE): SnakeState {
  const head = { x: Math.floor(size / 2), y: Math.floor(size / 2) }
  const tailVector = DIRECTION_VECTORS[OPPOSITE_DIRECTION[INITIAL_DIRECTION]]
  const snake = Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, i) => ({
    x: head.x + tailVector.x * i,
    y: head.y + tailVector.y * i,
  }))

  return {
    size,
    snake,
    direction: INITIAL_DIRECTION,
    turnQueue: [],
    food: placeFood(snake, size, random),
    score: 0,
    status: 'idle',
  }
}

export function startGame(state: SnakeState): SnakeState {
  return state.status === 'idle' ? { ...state, status: 'running' } : state
}

export function togglePause(state: SnakeState): SnakeState {
  if (state.status === 'running') return { ...state, status: 'paused' }
  if (state.status === 'paused') return { ...state, status: 'running' }
  return state
}

/**
 * Queues a turn. Reversing onto the neck and repeating the current direction are ignored;
 * the check is against the last *queued* turn so "up, then down" can't fold the snake in one tick.
 */
export function turn(state: SnakeState, direction: Direction): SnakeState {
  if (state.status !== 'running' || state.turnQueue.length >= MAX_QUEUED_TURNS) return state

  const reference = state.turnQueue.at(-1) ?? state.direction
  if (direction === reference || direction === OPPOSITE_DIRECTION[reference]) return state

  return { ...state, turnQueue: [...state.turnQueue, direction] }
}

/** Advances a running game by one move; any other status is returned untouched. */
export function step(state: SnakeState, random: Random = Math.random): SnakeState {
  if (state.status !== 'running') return state

  const [queued, ...restQueue] = state.turnQueue
  const direction = queued ?? state.direction
  const vector = DIRECTION_VECTORS[direction]
  const head = { x: state.snake[0].x + vector.x, y: state.snake[0].y + vector.y }

  if (head.x < 0 || head.y < 0 || head.x >= state.size || head.y >= state.size) {
    return { ...state, direction, turnQueue: restQueue, status: 'over' }
  }

  const eats = state.food !== null && head.x === state.food.x && head.y === state.food.y
  // The tail cell is vacated on this move (unless the snake grows), so moving into it is legal.
  const body = eats ? state.snake : state.snake.slice(0, -1)
  if (body.some((segment) => segment.x === head.x && segment.y === head.y)) {
    return { ...state, direction, turnQueue: restQueue, status: 'over' }
  }

  const snake = [head, ...body]
  if (!eats) return { ...state, snake, direction, turnQueue: restQueue }

  const food = placeFood(snake, state.size, random)
  return {
    ...state,
    snake,
    direction,
    turnQueue: restQueue,
    food,
    score: state.score + POINTS_PER_FOOD,
    status: food ? 'running' : 'won',
  }
}

/** The snake speeds up with every food, down to a floor. */
export function getTickInterval(score: number): number {
  return Math.max(MIN_TICK_MS, START_TICK_MS - score * TICK_STEP_MS)
}
