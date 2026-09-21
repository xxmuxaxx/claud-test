import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('opens the to-do list from the root URL', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Список дел' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/tasks')
  })

  it('has no Home or About sections in the navbar', () => {
    render(<App />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveTextContent('Список дел')
    expect(nav).not.toHaveTextContent('Главная')
    expect(nav).not.toHaveTextContent('О проекте')
  })
})
