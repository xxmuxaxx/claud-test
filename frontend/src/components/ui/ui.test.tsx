import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { LoadingRegion } from './LoadingRegion'

describe('cn', () => {
  it('lets the last of two conflicting Tailwind utilities win', () => {
    expect(cn('px-4 text-sm', 'px-2', false, undefined, 'font-bold')).toBe('text-sm px-2 font-bold')
  })
})

describe('Button', () => {
  it('is an ordinary enabled button by default', () => {
    render(<Button>Сохранить</Button>)
    const button = screen.getByRole('button', { name: 'Сохранить' })
    expect(button).toBeEnabled()
    expect(button).not.toHaveAttribute('aria-busy')
  })

  it('shows it is busy and ignores clicks while loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Сохранить
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Сохранить' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.setup().click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('LoadingRegion', () => {
  it('announces loading to assistive technology', () => {
    render(<LoadingRegion />)
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка…')
  })
})
