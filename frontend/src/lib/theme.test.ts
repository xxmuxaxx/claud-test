import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  isTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeStoredTheme,
} from './theme'

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

function stubSystemDark(matches: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('theme', () => {
  it('resolves "system" through the OS preference and keeps explicit choices', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('validates theme values', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('sepia')).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it('falls back to "system" for a missing or unknown stored value', () => {
    expect(readStoredTheme()).toBe('system')
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readStoredTheme()).toBe('system')
    writeStoredTheme('dark')
    expect(readStoredTheme()).toBe('dark')
  })

  it('toggles the `dark` class on <html>', () => {
    applyTheme('dark')
    expect(document.documentElement).toHaveClass('dark')
    applyTheme('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('follows the OS in "system" mode', () => {
    stubSystemDark(true)
    applyTheme('system')
    expect(document.documentElement).toHaveClass('dark')
    stubSystemDark(false)
    applyTheme('system')
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
