import type { Board, Game2048State, Tile } from '@/types/game2048'
import type { Direction, Point } from '@/types/snake'

/** Pure 2048 rules: no React, no globals. Randomness is passed in by the caller. */

export const BOARD_SIZE = 4
export const WIN_TILE = 2048
/** Chance that a freshly spawned tile is a 4 instead of a 2. */
export const FOUR_CHANCE = 0.1
export const INITIAL_TILES = 2
/** Minimum finger travel, in pixels, for a touch gesture to count as a swipe. */
export const SWIPE_THRESHOLD = 30

export const HIGH_SCORE_STORAGE_KEY = 'games.2048.highScore'

type Random = () => number

/** The tiles that are really on the board (not the ones finishing their slide into a merge). */
export const liveTiles = (tiles: Tile[]): Tile[] => tiles.filter((tile) => !tile.consumed)

export function toBoard(tiles: Tile[], size: number): Board {
  const board: Board = Array.from({ length: size }, () => Array(size).fill(0))
  for (const tile of liveTiles(tiles)) board[tile.y][tile.x] = tile.value
  return board
}

/** A new tile (a 2, or rarely a 4) on a random free cell, or `null` on a full board. Uses `random` twice. */
export function spawnTile(tiles: Tile[], size: number, id: number, random: Random): Tile | null {
  const taken = new Set(liveTiles(tiles).map(({ x, y }) => `${x},${y}`))
  const free: Point[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) return null

  const { x, y } = free[Math.min(Math.floor(random() * free.length), free.length - 1)]
  return { id, value: random() < 1 - FOUR_CHANCE ? 2 : 4, x, y }
}

export function createGame(random: Random = Math.random, size: number = BOARD_SIZE): Game2048State {
  const tiles: Tile[] = []
  for (let id = 0; id < INITIAL_TILES; id++) {
    const tile = spawnTile(tiles, size, id, random)
    if (tile) tiles.push(tile)
  }
  return { size, tiles, nextId: tiles.length, score: 0, status: 'running', continued: false }
}

/** The cells of line `index`, ordered from the wall the tiles slide towards. */
function lineCells(direction: Direction, index: number, size: number): Point[] {
  const order = Array.from({ length: size }, (_, i) => i)
  switch (direction) {
    case 'left':
      return order.map((x) => ({ x, y: index }))
    case 'right':
      return order.map((x) => ({ x: size - 1 - x, y: index }))
    case 'up':
      return order.map((y) => ({ x: index, y }))
    case 'down':
      return order.map((y) => ({ x: index, y: size - 1 - y }))
  }
}

/**
 * Slides every tile towards the `direction` wall. Two equal neighbours merge into a new tile (with
 * its own id, so it can pop in); the two originals are kept as `consumed`, parked on the merge cell.
 * A tile takes part in one merge per move. `moved` is false when nothing changed.
 */
export function slideTiles(
  tiles: Tile[],
  size: number,
  direction: Direction,
  nextId: number,
): { tiles: Tile[]; gained: number; moved: boolean; nextId: number } {
  const result: Tile[] = []
  let gained = 0
  let moved = false

  for (let index = 0; index < size; index++) {
    const cells = lineCells(direction, index, size)
    // The tiles of this line, nearest to the wall first.
    const line = cells.flatMap(({ x, y }) => tiles.filter((tile) => tile.x === x && tile.y === y))

    let slot = 0
    for (let i = 0; i < line.length; i++, slot++) {
      const tile = line[i]
      const target = cells[slot]
      const partner = line[i + 1]

      if (partner && partner.value === tile.value) {
        const value = tile.value * 2
        result.push(
          { id: nextId++, value, ...target, merged: true },
          { ...tile, ...target, consumed: true },
          { ...partner, ...target, consumed: true },
        )
        gained += value
        moved = true
        i++ // The partner is used up, so the merged tile can't merge again this move.
      } else {
        result.push({ ...tile, ...target })
        if (tile.x !== target.x || tile.y !== target.y) moved = true
      }
    }
  }

  return { tiles: result, gained, moved, nextId }
}

/** Is there an empty cell, or two equal neighbours that could merge? */
export function hasMoves(board: Board): boolean {
  return board.some((row, y) =>
    row.some((value, x) => value === 0 || value === row[x + 1] || value === board[y + 1]?.[x]),
  )
}

/**
 * Plays one move: slides, spawns a tile, then checks for the win (once) or the end. A move that
 * changes nothing, or any move once the game is over, returns the same state and spawns nothing.
 */
export function move(
  state: Game2048State,
  direction: Direction,
  random: Random = Math.random,
): Game2048State {
  if (state.status !== 'running') return state

  // Last move's leftovers (consumed tiles, animation flags) are dropped before sliding.
  const settled = liveTiles(state.tiles).map(({ id, value, x, y }) => ({ id, value, x, y }))
  const slid = slideTiles(settled, state.size, direction, state.nextId)
  if (!slid.moved) return state

  let { nextId } = slid
  const tiles = slid.tiles
  const spawned = spawnTile(tiles, state.size, nextId, random)
  if (spawned) {
    tiles.push({ ...spawned, isNew: true })
    nextId++
  }

  const board = toBoard(tiles, state.size)
  const won = !state.continued && Math.max(...board.flat()) >= WIN_TILE
  const status = won ? 'won' : hasMoves(board) ? 'running' : 'over'
  return { ...state, tiles, nextId, score: state.score + slid.gained, status }
}

/** After reaching 2048 the player may keep playing for a higher tile. */
export function continueGame(state: Game2048State): Game2048State {
  if (state.status !== 'won') return state
  const running = hasMoves(toBoard(state.tiles, state.size))
  return { ...state, continued: true, status: running ? 'running' : 'over' }
}

/** The dominant axis of a finger drag, or `null` when it was too short to be a swipe. */
export function swipeDirection(
  dx: number,
  dy: number,
  threshold: number = SWIPE_THRESHOLD,
): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}
