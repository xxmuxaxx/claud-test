import { useTranslation } from 'react-i18next'
import { fieldClass } from '@/components/ui/fieldClass'
import { cn } from '@/lib/cn'
import { isTheme, THEMES } from '@/lib/theme'
import { useThemeStore } from '@/store/useThemeStore'

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <select
      aria-label={t('theme.label')}
      value={theme}
      onChange={(event) => {
        if (isTheme(event.target.value)) setTheme(event.target.value)
      }}
      className={cn(fieldClass, 'w-auto')}
    >
      {THEMES.map((value) => (
        <option key={value} value={value}>
          {t(`theme.${value}`)}
        </option>
      ))}
    </select>
  )
}
