import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { HomePage } from '@/pages/HomePage'
import { LANGUAGE_STORAGE_KEY } from '@/i18n'
import { Navbar } from './Navbar'

function renderShell() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <>
          <Navbar />
          <HomePage />
        </>
      ),
    },
  ])
  return render(<RouterProvider router={router} />)
}

describe('LanguageSwitcher', () => {
  it('lists the three languages by their own names', () => {
    renderShell()
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Русский', 'English', 'ქართული'])
    expect(screen.getByRole('combobox', { name: 'Язык' })).toHaveValue('ru')
  })

  it('switches the whole UI, <html lang> and remembers the choice', async () => {
    const user = userEvent.setup()
    renderShell()
    const select = screen.getByRole('combobox', { name: 'Язык' })

    await user.selectOptions(select, 'en')
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'To-do list' })).toBeInTheDocument()
    expect(screen.getByLabelText('Increment')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ka')
    expect(
      screen.getByRole('heading', { name: 'კეთილი იყოს თქვენი მობრძანება' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'დავალებების სია' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('ka')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ka')
  })

  it('renders the inline <code> in the home page intro', () => {
    renderShell()
    expect(screen.getByText('src/pages/HomePage.tsx').tagName).toBe('CODE')
  })
})
