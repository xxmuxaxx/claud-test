import type ru from './locales/ru'

// Makes `t('…')` keys type-checked; Russian is the source of truth for the key structure.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof ru }
  }
}
