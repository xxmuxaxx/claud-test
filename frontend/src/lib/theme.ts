export const THEMES = ['system', 'light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

export const THEME_STORAGE_KEY = 'app.theme'

// Keep in sync with the inline script in `index.html`, which applies the stored theme before the
// first paint (no flash of the wrong theme).
const DARK_QUERY = '(prefers-color-scheme: dark)'

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme)
}

export function readStoredTheme(): Theme {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : 'system'
  } catch {
    return 'system' // Storage blocked: follow the OS.
  }
}

export function writeStoredTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Not persisting the choice must never break the UI.
  }
}

/** Whether the OS asks for a dark UI; `false` where `matchMedia` is unavailable (jsdom). */
export function systemPrefersDark(): boolean {
  return window.matchMedia?.(DARK_QUERY).matches ?? false
}

export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light'
  return theme
}

/** Puts the theme on `<html>`: the `dark` class drives Tailwind's `dark:` variant. */
export function applyTheme(theme: Theme) {
  const dark = resolveTheme(theme, systemPrefersDark()) === 'dark'
  document.documentElement.classList.toggle('dark', dark)
}

/** Calls `onChange` when the OS switches between light and dark; returns the unsubscribe function. */
export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia?.(DARK_QUERY)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}
