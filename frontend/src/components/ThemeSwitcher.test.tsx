import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import { useThemeStore } from '@/store/useThemeStore'
import { ThemeSwitcher } from './ThemeSwitcher'

afterEach(() => {
  useThemeStore.getState().setTheme('system')
  localStorage.clear()
})

describe('ThemeSwitcher', () => {
  it('offers system, light and dark, starting with the system theme', () => {
    render(<ThemeSwitcher />)
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Системная', 'Светлая', 'Тёмная'])
    expect(screen.getByRole('combobox', { name: 'Тема' })).toHaveValue('system')
  })

  it('switches <html> between light and dark and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher />)
    const select = screen.getByRole('combobox', { name: 'Тема' })

    await user.selectOptions(select, 'dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    await user.selectOptions(select, 'light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
})
