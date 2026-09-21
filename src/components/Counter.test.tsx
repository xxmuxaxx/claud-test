import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'
import { useCounterStore } from '@/store/useCounterStore'

describe('Counter', () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 })
  })

  it('renders the initial count', () => {
    render(<Counter />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('increments and decrements the count', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByLabelText('Увеличить'))
    await user.click(screen.getByLabelText('Увеличить'))
    expect(screen.getByText('2')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Уменьшить'))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('resets the count', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByLabelText('Увеличить'))
    await user.click(screen.getByText('Сбросить'))
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
