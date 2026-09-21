import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { HIGH_SCORE_STORAGE_KEY } from '@/lib/snake'
import { SnakeGame } from './SnakeGame'

// Board is 20×20, so one cell is 5% of the board; the snake starts at (10, 10) heading right.
// `Math.random() === 0` puts the first food in the top-left corner, (0, 0).
const TICK = 140

const press = (code: string) => fireEvent.keyDown(window, { code })
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const board = () => screen.getByRole('img', { name: 'Игровое поле' })
const head = () => {
  const { left, top } = board().querySelector<HTMLElement>('[data-cell=head]')!.style
  return { left, top }
}
const start = () => fireEvent.click(screen.getByRole('button', { name: 'Старт' }))

/** Steers the snake from (10, 10) up to the top wall and left along it into the food at (0, 0). */
function eatFirstFood() {
  press('ArrowUp')
  advance(TICK * 10)
  press('ArrowLeft')
  advance(TICK * 10)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('SnakeGame', () => {
  it('waits on a start screen with a zero score', () => {
    render(<SnakeGame />)

    expect(screen.getByText('Счёт: 0')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Старт' })).toBeInTheDocument()
    expect(board().querySelectorAll('[data-cell=body]')).toHaveLength(2)
    expect(board().querySelectorAll('[data-cell=food]')).toHaveLength(1)

    advance(TICK * 5)
    expect(head()).toEqual({ left: '50%', top: '50%' })
  })

  it('moves on its own once started', () => {
    render(<SnakeGame />)
    start()

    expect(screen.queryByRole('button', { name: 'Старт' })).not.toBeInTheDocument()
    advance(TICK * 3)
    expect(head()).toEqual({ left: '65%', top: '50%' })
  })

  it('steers with the arrow keys and W/A/S/D, and a direction key starts the game', () => {
    render(<SnakeGame />)

    press('KeyW')
    advance(TICK)
    expect(head()).toEqual({ left: '50%', top: '45%' })

    press('ArrowLeft')
    advance(TICK)
    expect(head()).toEqual({ left: '45%', top: '45%' })

    press('KeyS')
    advance(TICK)
    expect(head()).toEqual({ left: '45%', top: '50%' })

    press('KeyD')
    advance(TICK)
    expect(head()).toEqual({ left: '50%', top: '50%' })
  })

  it('steers with the on-screen buttons', () => {
    render(<SnakeGame />)

    fireEvent.click(screen.getByRole('button', { name: 'Вверх' }))
    advance(TICK)
    expect(head()).toEqual({ left: '50%', top: '45%' })

    fireEvent.click(screen.getByRole('button', { name: 'Влево' }))
    advance(TICK)
    expect(head()).toEqual({ left: '45%', top: '45%' })
  })

  it('does not let the snake reverse into itself', () => {
    render(<SnakeGame />)
    start()

    press('ArrowLeft')
    advance(TICK)

    expect(head()).toEqual({ left: '55%', top: '50%' })
    expect(screen.queryByText('Game Over')).not.toBeInTheDocument()
  })

  it('grows and scores when it eats', () => {
    render(<SnakeGame />)
    eatFirstFood()

    expect(screen.getByText('Счёт: 1')).toBeInTheDocument()
    expect(board().querySelectorAll('[data-cell=body]')).toHaveLength(3)
    expect(screen.queryByText('Game Over')).not.toBeInTheDocument()
  })

  it('pauses and resumes with the button, freezing the snake in between', () => {
    render(<SnakeGame />)
    start()
    advance(TICK)

    fireEvent.click(screen.getByRole('button', { name: 'Пауза' }))
    expect(screen.getByText('Пауза')).toBeInTheDocument()
    const frozen = head()
    advance(TICK * 5)
    expect(head()).toEqual(frozen)

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
    expect(screen.queryByRole('button', { name: 'Продолжить' })).not.toBeInTheDocument()
    advance(TICK)
    expect(head()).not.toEqual(frozen)
  })

  it('pauses and resumes with Space and P', () => {
    render(<SnakeGame />)
    start()

    press('Space')
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument()
    press('Space')
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument()
    press('KeyP')
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument()
  })

  it('cannot be paused before the game starts', () => {
    render(<SnakeGame />)

    expect(screen.getByRole('button', { name: 'Пауза' })).toBeDisabled()
  })

  it('pauses by itself when the tab is hidden', () => {
    render(<SnakeGame />)
    start()

    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument()
  })

  it('ignores game keys typed into a text field', () => {
    render(
      <>
        <input aria-label="Заметка" />
        <SnakeGame />
      </>,
    )
    start()

    fireEvent.keyDown(screen.getByLabelText('Заметка'), { code: 'KeyW', bubbles: true })
    advance(TICK)

    expect(head()).toEqual({ left: '55%', top: '50%' })
  })

  it('ends on the wall with Game Over, the score and a restart button', () => {
    render(<SnakeGame />)
    start()
    advance(TICK * 11)

    expect(screen.getByText('Game Over')).toBeInTheDocument()
    expect(screen.getByText('Ваш счёт: 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeDisabled()
    const crashed = head()
    advance(TICK * 5)
    expect(head()).toEqual(crashed)
  })

  it('restarts from the initial position with a fresh score', () => {
    render(<SnakeGame />)
    eatFirstFood()
    advance(TICK * 30)
    expect(screen.getByText('Game Over')).toBeInTheDocument()
    expect(screen.getByText('Ваш счёт: 1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Начать заново' }))

    expect(screen.queryByText('Game Over')).not.toBeInTheDocument()
    expect(screen.getByText('Счёт: 0')).toBeInTheDocument()
    expect(board().querySelectorAll('[data-cell=body]')).toHaveLength(2)
    expect(head()).toEqual({ left: '50%', top: '50%' })
    advance(TICK)
    expect(head()).toEqual({ left: '55%', top: '50%' })
  })
})

describe('SnakeGame high score', () => {
  it('shows the record saved in localStorage', () => {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '42')
    render(<SnakeGame />)

    expect(screen.getByText('Рекорд: 42')).toBeInTheDocument()
  })

  it('ignores a corrupted saved record', () => {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, 'not a number')
    render(<SnakeGame />)

    expect(screen.getByText('Рекорд: 0')).toBeInTheDocument()
  })

  it('raises and saves the record as the score grows, and keeps it after a restart', () => {
    render(<SnakeGame />)
    eatFirstFood()

    expect(screen.getByText('Рекорд: 1')).toBeInTheDocument()
    expect(window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('1')

    advance(TICK * 30)
    fireEvent.click(screen.getByRole('button', { name: 'Начать заново' }))
    expect(screen.getByText('Счёт: 0')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 1')).toBeInTheDocument()
  })

  it('does not lower a saved record', () => {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '42')
    render(<SnakeGame />)
    eatFirstFood()

    expect(screen.getByText('Счёт: 1')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 42')).toBeInTheDocument()
    expect(window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe('42')
  })

  it('still plays when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<SnakeGame />)
    eatFirstFood()

    expect(screen.getByText('Счёт: 1')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 1')).toBeInTheDocument()
  })
})
