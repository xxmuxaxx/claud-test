import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { HIGH_SCORE_STORAGE_KEY } from '@/lib/game2048'
import { Game2048 } from './Game2048'

// `Math.random() === 0` puts every new tile on the first free cell as a 2, so a new game is
// [2, 2, ., .] in the top row and each successful move adds one more 2 at the first gap.

const press = (code: string) => fireEvent.keyDown(window, { code })
const board = () => screen.getByRole('list', { name: 'Игровое поле' })
/** Tile values by position, `0` for empty cells. Tiles hidden under a merged one are not counted. */
const values = () => {
  const grid = Array.from({ length: 4 }, () => Array(4).fill(0))
  for (const tile of within(board()).getAllByRole('listitem')) {
    grid[Number(tile.dataset.y)][Number(tile.dataset.x)] = Number(tile.textContent)
  }
  return grid
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Game2048', () => {
  it('starts with two tiles and a zero score', () => {
    render(<Game2048 />)

    expect(screen.getByText('Счёт: 0')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 0')).toBeInTheDocument()
    expect(values()).toEqual([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])
  })

  it('merges tiles on an arrow key and scores the merge', () => {
    render(<Game2048 />)

    press('ArrowLeft')

    expect(values()[0]).toEqual([4, 2, 0, 0])
    expect(screen.getByText('Счёт: 4')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 4')).toBeInTheDocument()
  })

  it('also moves on W/A/S/D, whatever the keyboard layout', () => {
    render(<Game2048 />)

    press('KeyS')

    // Both tiles fall to the bottom row; the new one lands in the freed top-left corner.
    expect(values().map((row) => row[0])).toEqual([2, 0, 0, 2])
  })

  it('ignores a move that changes nothing', () => {
    render(<Game2048 />)

    press('ArrowUp')

    expect(values()[0]).toEqual([2, 2, 0, 0])
    expect(values().flat().filter(Boolean)).toHaveLength(2)
  })

  it('moves on a swipe over the board', () => {
    render(<Game2048 />)

    fireEvent.pointerDown(board(), { clientX: 200, clientY: 100 })
    fireEvent.pointerUp(board(), { clientX: 100, clientY: 110 })

    expect(values()[0]).toEqual([4, 2, 0, 0])
  })

  it('ignores a tap', () => {
    render(<Game2048 />)

    fireEvent.pointerDown(board(), { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(board(), { clientX: 102, clientY: 101 })

    expect(values()[0]).toEqual([2, 2, 0, 0])
  })

  it('gives each tile an accessible position', () => {
    render(<Game2048 />)

    expect(
      within(board()).getByRole('listitem', { name: '2, строка 1, столбец 2' }),
    ).toBeInTheDocument()
  })

  it('keeps the same tile element when it slides, so that CSS can animate it', () => {
    render(<Game2048 />)
    const tile = within(board()).getByRole('listitem', { name: '2, строка 1, столбец 2' })

    press('ArrowRight')

    expect(tile).toBeInTheDocument()
    expect(tile).toHaveAttribute('data-x', '3')
    expect(tile.style.transform).toContain('3 *')
  })

  it('marks merged and new tiles for the pop animation and hides the tiles it merged', () => {
    render(<Game2048 />)

    press('ArrowLeft')

    const items = within(board()).getAllByRole('listitem')
    expect(items.map((tile) => tile.textContent)).toEqual(['4', '2'])
    expect(items[0].firstElementChild).toHaveClass('animate-tile-merge')
    expect(items[1].firstElementChild).toHaveClass('animate-tile-appear')
    // The two 2s that slid together are still in the DOM, but out of the accessibility tree.
    expect(board().querySelectorAll('li[aria-hidden=true]')).toHaveLength(2)
  })

  it('starts over on "Новая игра" but keeps the record', () => {
    render(<Game2048 />)
    press('ArrowLeft')

    fireEvent.click(screen.getByRole('button', { name: 'Новая игра' }))

    expect(screen.getByText('Счёт: 0')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 4')).toBeInTheDocument()
    expect(values()[0]).toEqual([2, 2, 0, 0])
    expect(window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('4')
  })

  it('restores the record from a previous visit', () => {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '512')

    render(<Game2048 />)

    expect(screen.getByText('Рекорд: 512')).toBeInTheDocument()
  })
})
