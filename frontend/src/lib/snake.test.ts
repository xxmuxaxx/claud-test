import { describe, expect, it } from 'vitest'
import type { SnakeState } from '@/types/snake'
import {
  BOARD_SIZE,
  MIN_TICK_MS,
  START_TICK_MS,
  createGame,
  getTickInterval,
  placeFood,
  startGame,
  step,
  togglePause,
  turn,
} from './snake'

/** A running 5×5 game: snake of 3 heading right along row 2, food far away in the corner. */
function running(overrides: Partial<SnakeState> = {}): SnakeState {
  return {
    size: 5,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
    direction: 'right',
    turnQueue: [],
    food: { x: 4, y: 4 },
    score: 0,
    status: 'running',
    ...overrides,
  }
}

const first = () => 0
const last = () => 0.999

describe('createGame', () => {
  it('starts idle with a short snake in the middle of the board, heading right', () => {
    const state = createGame(first)

    expect(state.status).toBe('idle')
    expect(state.score).toBe(0)
    expect(state.direction).toBe('right')
    expect(state.size).toBe(BOARD_SIZE)
    const mid = Math.floor(BOARD_SIZE / 2)
    expect(state.snake).toEqual([
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ])
  })

  it('places the food on a free cell', () => {
    const state = createGame(last)

    expect(state.food).not.toBeNull()
    expect(state.snake).not.toContainEqual(state.food)
  })
})

describe('placeFood', () => {
  it('never picks a cell occupied by the snake', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]

    expect(placeFood(snake, 2, first)).toEqual({ x: 0, y: 1 })
    expect(placeFood(snake, 2, last)).toEqual({ x: 1, y: 1 })
  })

  it('returns null when the board is full', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]

    expect(placeFood(snake, 2, first)).toBeNull()
  })
})

describe('status changes', () => {
  it('starts only from idle', () => {
    expect(startGame(createGame(first)).status).toBe('running')
    expect(startGame(running({ status: 'over' })).status).toBe('over')
  })

  it('toggles between running and paused, and only those', () => {
    const paused = togglePause(running())
    expect(paused.status).toBe('paused')
    expect(togglePause(paused).status).toBe('running')
    expect(togglePause(running({ status: 'over' })).status).toBe('over')
    expect(togglePause(createGame(first)).status).toBe('idle')
  })

  it('does not move while paused', () => {
    const paused = running({ status: 'paused' })
    expect(step(paused)).toBe(paused)
  })
})

describe('step', () => {
  it('moves one cell in the current direction, keeping the length', () => {
    const next = step(running(), first)

    expect(next.snake).toEqual([
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ])
    expect(next.score).toBe(0)
  })

  it('grows, scores and re-places the food when it eats', () => {
    const state = running({ food: { x: 3, y: 2 } })
    const next = step(state, first)

    expect(next.snake).toHaveLength(4)
    expect(next.snake[0]).toEqual({ x: 3, y: 2 })
    expect(next.score).toBe(1)
    expect(next.food).toEqual({ x: 0, y: 0 })
    expect(next.status).toBe('running')
  })

  it.each([
    ['right', { x: 4, y: 2 }, { x: 3, y: 2 }],
    ['left', { x: 0, y: 2 }, { x: 1, y: 2 }],
    ['up', { x: 0, y: 0 }, { x: 0, y: 1 }],
    ['down', { x: 4, y: 4 }, { x: 4, y: 3 }],
  ] as const)('ends the game on the %s wall', (direction, head, neck) => {
    const state = running({
      direction,
      snake: [head, neck, { x: neck.x + (neck.x - head.x), y: neck.y + (neck.y - head.y) }],
    })

    expect(step(state, first).status).toBe('over')
  })

  it('ends the game when the snake bites itself', () => {
    // A coiled snake whose head is about to turn down into its own body.
    const state = running({
      direction: 'up',
      snake: [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
      ],
      turnQueue: ['right'],
    })

    expect(step(state, first).status).toBe('over')
  })

  it('may move into the cell the tail is leaving', () => {
    // A 2×2 loop: the head chases its own tail, which moves away on the same step.
    const state = running({
      direction: 'left',
      snake: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      turnQueue: ['down'],
    })

    expect(step(state, first).status).toBe('running')
  })

  it('ends the game when the snake grows into its own tail', () => {
    const state = running({
      direction: 'left',
      snake: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      turnQueue: ['down'],
      food: { x: 1, y: 2 },
    })

    expect(step(state, first).status).toBe('over')
  })

  it('wins when the snake fills the board', () => {
    const state = running({
      size: 2,
      direction: 'down',
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
      food: { x: 0, y: 1 },
    })
    const next = step(state, first)

    expect(next.status).toBe('won')
    expect(next.food).toBeNull()
    expect(next.snake).toHaveLength(4)
  })
})

describe('turn', () => {
  it('applies a queued turn on the next step', () => {
    const next = step(turn(running(), 'up'), first)

    expect(next.direction).toBe('up')
    expect(next.snake[0]).toEqual({ x: 2, y: 1 })
    expect(next.turnQueue).toEqual([])
  })

  it('ignores reversing and repeating the current direction', () => {
    expect(turn(running(), 'left').turnQueue).toEqual([])
    expect(turn(running(), 'right').turnQueue).toEqual([])
  })

  it('checks against the last queued turn, so up-then-down cannot fold the snake', () => {
    const state = turn(turn(running(), 'up'), 'down')

    expect(state.turnQueue).toEqual(['up'])
  })

  it('lets two quick turns land on consecutive steps', () => {
    let state = turn(turn(running(), 'up'), 'left')
    state = step(state, first)
    expect(state.direction).toBe('up')
    state = step(state, first)
    expect(state.direction).toBe('left')
  })

  it('caps the queue', () => {
    let state = running()
    for (const direction of ['up', 'left', 'down', 'right'] as const) state = turn(state, direction)

    expect(state.turnQueue).toEqual(['up', 'left'])
  })

  it('is ignored unless the game is running', () => {
    const paused = running({ status: 'paused' })
    expect(turn(paused, 'up')).toBe(paused)
    const idle = createGame(first)
    expect(turn(idle, 'up')).toBe(idle)
  })
})

describe('getTickInterval', () => {
  it('speeds up with the score but never below the floor', () => {
    expect(getTickInterval(0)).toBe(START_TICK_MS)
    expect(getTickInterval(5)).toBeLessThan(START_TICK_MS)
    expect(getTickInterval(1000)).toBe(MIN_TICK_MS)
  })
})
