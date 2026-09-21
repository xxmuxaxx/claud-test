import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'
import i18n from '@/i18n'
import { backend } from './fakeBackend'

// Tests assert on Russian copy; pin the language so they don't depend on the jsdom locale
// or on a language left behind by a previous test.
beforeEach(async () => {
  await i18n.changeLanguage('ru')
})

// No test talks to a real server: `fetch` is an in-memory backend, empty at the start of each test.
// (Re-installed every time because some tests call `vi.unstubAllGlobals()`.)
beforeEach(() => {
  backend.reset()
  backend.fetch.mockClear()
  vi.stubGlobal('fetch', backend.fetch)
})
