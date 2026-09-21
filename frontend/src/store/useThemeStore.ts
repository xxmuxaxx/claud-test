import { create } from 'zustand'
import {
  applyTheme,
  readStoredTheme,
  watchSystemTheme,
  writeStoredTheme,
  type Theme,
} from '@/lib/theme'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    writeStoredTheme(theme)
    applyTheme(theme)
    set({ theme })
  },
}))

/** Applies the stored theme and keeps "system" in step with the OS; call once at startup. */
export function initTheme() {
  applyTheme(useThemeStore.getState().theme)
  return watchSystemTheme(() => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system')
  })
}
