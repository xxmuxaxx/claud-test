export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Point {
  x: number
  y: number
}

/**
 * `idle`: waiting for the first move; `won`: the snake fills the whole board (there is no room
 * left for food); `over`: hit a wall or itself.
 */
export type SnakeStatus = 'idle' | 'running' | 'paused' | 'over' | 'won'

export interface SnakeState {
  /** Board is `size` × `size` cells. */
  size: number
  /** Segments, head first. */
  snake: Point[]
  /** Direction of the last move. */
  direction: Direction
  /** Turns requested since the last move, so two quick key presses within one tick both count. */
  turnQueue: Direction[]
  /** `null` only once the board is full. */
  food: Point | null
  score: number
  status: SnakeStatus
}
