import { describe, expect, it } from 'vitest'
import type { Board, Game2048State, Tile } from '@/types/game2048'
import {
  continueGame,
  createGame,
  hasMoves,
  liveTiles,
  move,
  slideTiles,
  spawnTile,
  swipeDirection,
  toBoard,
} from './game2048'

/** One tile per non-zero value; ids count up in reading order, so the tests can name a tile. */
const tilesOf = (board: Board): Tile[] =>
  board
    .flatMap((row, y) => row.map((value, x) => ({ value, x, y })))
    .filter((tile) => tile.value)
    .map((tile, id) => ({ id, ...tile }))

const state = (board: Board, overrides: Partial<Game2048State> = {}): Game2048State => {
  const tiles = tilesOf(board)
  return {
    size: board.length,
    tiles,
    nextId: tiles.length,
    score: 0,
    status: 'running',
    continued: false,
    ...overrides,
  }
}

const boardOf = (game: Game2048State) => toBoard(game.tiles, game.size)

/** Always the first free cell, always a 2. */
const first = () => 0

describe('slideTiles', () => {
  const slide = (board: Board, direction: Parameters<typeof slideTiles>[2]) => {
    const result = slideTiles(tilesOf(board), board.length, direction, 100)
    return { ...result, board: toBoard(result.tiles, board.length) }
  }

  it.each([
    [[0, 0, 0, 0], [0, 0, 0, 0], 0],
    [[0, 2, 0, 2], [4, 0, 0, 0], 4],
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 2, 0], [4, 2, 0, 0], 4],
    [[4, 2, 2, 0], [4, 4, 0, 0], 4],
    [[2, 2, 4, 0], [4, 4, 0, 0], 4],
    [[2, 4, 2, 4], [2, 4, 2, 4], 0],
    [[0, 0, 0, 8], [8, 0, 0, 0], 0],
  ])('slides the row %j left into %j (+%i)', (row, expected, gained) => {
    const result = slide([row, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'left')
    expect(result.board[0]).toEqual(expected)
    expect(result.gained).toBe(gained)
  })

  const board: Board = [
    [2, 0, 0, 2],
    [0, 4, 0, 0],
    [0, 4, 0, 0],
    [8, 0, 0, 0],
  ]

  it('slides and merges in every direction', () => {
    expect(slide(board, 'left').board).toEqual([
      [4, 0, 0, 0],
      [4, 0, 0, 0],
      [4, 0, 0, 0],
      [8, 0, 0, 0],
    ])
    expect(slide(board, 'right').board).toEqual([
      [0, 0, 0, 4],
      [0, 0, 0, 4],
      [0, 0, 0, 4],
      [0, 0, 0, 8],
    ])
    expect(slide(board, 'up').board).toEqual([
      [2, 8, 0, 2],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])
    expect(slide(board, 'down').board).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [8, 8, 0, 2],
    ])
  })

  it('reports a slide that changes nothing', () => {
    const packed: Board = [
      [2, 4, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    expect(slide(packed, 'left').moved).toBe(false)
    expect(slide(packed, 'up').moved).toBe(false)
    expect(slide(packed, 'right').moved).toBe(true)
  })

  it('keeps the identity of tiles that only slide', () => {
    const result = slideTiles(tilesOf([[0, 0, 2, 0]]), 4, 'left', 100)
    expect(result.tiles).toEqual([{ id: 0, value: 2, x: 0, y: 0 }])
  })

  it('merges into a new tile and parks both originals under it', () => {
    const { tiles, nextId } = slideTiles(tilesOf([[0, 2, 0, 2]]), 4, 'left', 100)

    expect(nextId).toBe(101)
    expect(tiles).toContainEqual({ id: 100, value: 4, x: 0, y: 0, merged: true })
    expect(tiles).toContainEqual({ id: 0, value: 2, x: 0, y: 0, consumed: true })
    expect(tiles).toContainEqual({ id: 1, value: 2, x: 0, y: 0, consumed: true })
    expect(liveTiles(tiles)).toHaveLength(1)
  })
})

describe('spawnTile', () => {
  it('puts a 2 or a 4 on the chosen free cell', () => {
    const tiles = tilesOf([
      [2, 0],
      [0, 0],
    ])
    expect(spawnTile(tiles, 2, 7, () => 0)).toEqual({ id: 7, value: 2, x: 1, y: 0 })

    // The first draw picks the cell (the last free one is (1, 1)), the second the value: the top 10% is a 4.
    const values = [0.99, 0.95]
    expect(spawnTile(tiles, 2, 7, () => values.shift()!)).toEqual({ id: 7, value: 4, x: 1, y: 1 })
  })

  it('does not count consumed tiles as taking a cell', () => {
    const tiles: Tile[] = [{ id: 0, value: 2, x: 0, y: 0, consumed: true }]
    expect(spawnTile(tiles, 1, 1, first)).toEqual({ id: 1, value: 2, x: 0, y: 0 })
  })

  it('returns null on a full board', () => {
    const tiles = tilesOf([
      [2, 4],
      [4, 2],
    ])
    expect(spawnTile(tiles, 2, 9, first)).toBeNull()
  })
})

describe('createGame', () => {
  it('starts with two tiles and a zero score', () => {
    const game = createGame(first)
    expect(game.tiles).toEqual([
      { id: 0, value: 2, x: 0, y: 0 },
      { id: 1, value: 2, x: 1, y: 0 },
    ])
    expect(game).toMatchObject({
      size: 4,
      nextId: 2,
      score: 0,
      status: 'running',
      continued: false,
    })
  })
})

describe('hasMoves', () => {
  it('is true with an empty cell or a merge available', () => {
    expect(
      hasMoves([
        [2, 0],
        [4, 8],
      ]),
    ).toBe(true)
    expect(
      hasMoves([
        [2, 2],
        [4, 8],
      ]),
    ).toBe(true)
    expect(
      hasMoves([
        [2, 4],
        [2, 8],
      ]),
    ).toBe(true)
  })

  it('is false on a full board without equal neighbours', () => {
    expect(
      hasMoves([
        [2, 4],
        [4, 2],
      ]),
    ).toBe(false)
  })
})

describe('move', () => {
  const row = (values: number[]): Board => [values, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]

  it('slides, scores and spawns a new tile', () => {
    const result = move(state(row([2, 2, 0, 0])), 'left', first)

    expect(boardOf(result)[0]).toEqual([4, 2, 0, 0])
    expect(result.score).toBe(4)
    expect(result.status).toBe('running')
  })

  it('marks what the animation needs: the spawned tile is new, the merged one is merged', () => {
    const result = move(state(row([2, 2, 0, 0])), 'left', first)

    expect(result.tiles.filter((t) => t.isNew)).toEqual([
      { id: 3, value: 2, x: 1, y: 0, isNew: true },
    ])
    expect(result.tiles.filter((t) => t.merged)).toEqual([
      { id: 2, value: 4, x: 0, y: 0, merged: true },
    ])
    expect(result.tiles.filter((t) => t.consumed).map((t) => t.id)).toEqual([0, 1])
    expect(result.nextId).toBe(4)
  })

  it('drops the previous move’s leftovers and flags on the next move', () => {
    const afterMerge = move(state(row([2, 2, 0, 0])), 'left', first) // [4, 2, ., .]
    const next = move(afterMerge, 'right', first)

    expect(next.tiles.some((t) => t.consumed || t.merged)).toBe(false)
    expect(next.tiles.filter((t) => t.isNew)).toHaveLength(1)
    // The 4 and the 2 slid to the right edge as the same tiles.
    expect(next.tiles.find((t) => t.id === 2)).toMatchObject({ value: 4, x: 2, y: 0 })
    expect(next.tiles.find((t) => t.id === 3)).toMatchObject({ value: 2, x: 3, y: 0 })
  })

  it('ignores a move that changes nothing: no spawn, same state', () => {
    const before = state(row([2, 0, 0, 0]))
    expect(move(before, 'left', first)).toBe(before)
  })

  it('ends the game when the board fills up with no merges left', () => {
    const result = move(
      state([
        [4, 4, 2, 4],
        [2, 2, 4, 2],
        [4, 4, 2, 4],
        [0, 2, 4, 2],
      ]),
      'down',
      first,
    )

    // The slide leaves a checkerboard with a hole at the top left, and the new 2 fills it.
    expect(boardOf(result)[0][0]).toBe(2)
    expect(boardOf(result).flat()).not.toContain(0)
    expect(result.status).toBe('over')
  })

  it('does nothing once the game is over', () => {
    const over = state(
      [
        [2, 4],
        [4, 0],
      ],
      { status: 'over' },
    )
    expect(move(over, 'right', first)).toBe(over)
  })

  describe('reaching 2048', () => {
    const almost = () => state(row([1024, 1024, 0, 0]))

    it('wins and freezes the board', () => {
      const won = move(almost(), 'left', first)
      expect(won.status).toBe('won')
      expect(move(won, 'right', first)).toBe(won)
    })

    it('can be continued, and then does not announce the win again', () => {
      const won = move(almost(), 'left', first)
      const continued = continueGame(won)
      expect(continued).toMatchObject({ status: 'running', continued: true })

      const next = move(continued, 'right', first)
      expect(next.status).toBe('running')
      expect(next).not.toBe(continued)
    })

    it('does not continue a game that has not been won', () => {
      const running = almost()
      expect(continueGame(running)).toBe(running)
    })
  })
})

describe('swipeDirection', () => {
  it('picks the dominant axis', () => {
    expect(swipeDirection(80, 10)).toBe('right')
    expect(swipeDirection(-80, 10)).toBe('left')
    expect(swipeDirection(5, 60)).toBe('down')
    expect(swipeDirection(5, -60)).toBe('up')
  })

  it('ignores taps and tiny drags', () => {
    expect(swipeDirection(0, 0)).toBeNull()
    expect(swipeDirection(20, -25)).toBeNull()
  })
})
