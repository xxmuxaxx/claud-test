import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('games pages', () => {
  it('lists the available games as cards at /games', () => {
    renderAt('/games')

    expect(screen.getByRole('heading', { level: 1, name: 'Игры' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Змейка' })).toBeInTheDocument()
    expect(screen.getByText(/классическая игра snake/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '2048' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /играть: 2048/i })).toHaveAttribute(
      'href',
      '/games/2048',
    )
    expect(screen.getByRole('link', { name: /играть: змейка/i })).toHaveAttribute(
      'href',
      '/games/snake',
    )
  })

  it('opens Snake from its card and returns to the catalog', async () => {
    const user = userEvent.setup()
    const router = renderAt('/games')

    await user.click(screen.getByRole('link', { name: /играть: змейка/i }))
    expect(router.state.location.pathname).toBe('/games/snake')
    expect(screen.getByRole('heading', { level: 1, name: 'Змейка' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Игровое поле' })).toBeInTheDocument()
    expect(screen.getByText('Счёт: 0')).toBeInTheDocument()
    expect(screen.getByText('Рекорд: 0')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '← Назад к играм' }))
    expect(router.state.location.pathname).toBe('/games')
    expect(screen.getByRole('heading', { level: 1, name: 'Игры' })).toBeInTheDocument()
  })

  it('opens 2048 from its card', async () => {
    const user = userEvent.setup()
    const router = renderAt('/games')

    await user.click(screen.getByRole('link', { name: /играть: 2048/i }))

    expect(router.state.location.pathname).toBe('/games/2048')
    expect(screen.getByRole('heading', { level: 1, name: '2048' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Игровое поле' })).toBeInTheDocument()
    expect(screen.getByText('Счёт: 0')).toBeInTheDocument()
  })

  it('has a Games link in the navbar', async () => {
    const user = userEvent.setup()
    const router = renderAt('/')

    await user.click(screen.getByRole('link', { name: 'Игры' }))

    expect(router.state.location.pathname).toBe('/games')
  })
})
