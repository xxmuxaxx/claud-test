import { useTranslation } from 'react-i18next'
import { fieldClass } from '@/components/ui/fieldClass'
import { cn } from '@/lib/cn'
import { LANGUAGES, type LanguageCode } from '@/i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <select
      aria-label={t('language.label')}
      value={i18n.resolvedLanguage}
      onChange={(event) => void i18n.changeLanguage(event.target.value as LanguageCode)}
      className={cn(fieldClass, 'w-auto')}
    >
      {LANGUAGES.map(({ code, name }) => (
        // Each language is named in itself, so it stays findable when the UI is in the wrong one.
        <option key={code} value={code} lang={code}>
          {name}
        </option>
      ))}
    </select>
  )
}
