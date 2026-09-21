import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import ka from './locales/ka'
import ru from './locales/ru'

export const LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'ka', name: 'ქართული' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const LANGUAGE_STORAGE_KEY = 'app.language'

// Resources are bundled, so `initAsync: false` makes init synchronous and the first render
// already has translations — no Suspense boundary or loading state needed.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      ka: { translation: ka },
    },
    supportedLngs: LANGUAGES.map(({ code }) => code),
    // Strip the region so "ru-RU" / "en-GB" resolve to the bundled "ru" / "en".
    load: 'languageOnly',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes.
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    initAsync: false,
  })

// Keep <html lang> in sync for screen readers, hyphenation and browser translation prompts.
function syncDocumentLanguage(language: string) {
  document.documentElement.lang = language
}

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language)
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
