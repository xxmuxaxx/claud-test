/** Rows of values, top to bottom; `0` is an empty cell. Derived from the tiles, for the rules. */
export type Board = number[][]

/**
 * A tile keeps its `id` for as long as it lives, so the UI can slide the same element to a new cell
 * instead of redrawing the board.
 */
export interface Tile {
  id: number
  value: number
  x: number
  y: number
  /** Spawned by the last move. */
  isNew?: boolean
  /** Made by merging two tiles in the last move. */
  merged?: boolean
  /** One of the two tiles that merged in the last move: it slides into place under the merged tile and is then dropped. */
  consumed?: boolean
}

/**
 * `running`: can still move; `won`: a 2048 tile appeared (offered once, then the player may keep
 * going); `over`: the board is full and nothing can merge.
 */
export type Game2048Status = 'running' | 'won' | 'over'

export interface Game2048State {
  /** Board is `size` × `size` cells. */
  size: number
  /** Live tiles, plus the `consumed` ones from the last move (kept only so they can finish sliding). */
  tiles: Tile[]
  /** The `id` for the next tile. */
  nextId: number
  score: number
  status: Game2048Status
  /** The player chose to go on after reaching 2048, so the win isn't announced again. */
  continued: boolean
}
