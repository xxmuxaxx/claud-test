import { useTranslation } from 'react-i18next'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{t('about.title')}</h1>
      <p className="text-slate-600 dark:text-slate-400">{t('about.body')}</p>
    </div>
  )
}
