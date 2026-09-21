import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import i18n from '@/i18n'

// Tests assert on Russian copy; pin the language so they don't depend on the jsdom locale
// or on a language left behind by a previous test.
beforeEach(async () => {
  await i18n.changeLanguage('ru')
})
