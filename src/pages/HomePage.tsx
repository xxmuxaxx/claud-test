import { Trans, useTranslation } from 'react-i18next'
import { Counter } from '@/components/Counter'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{t('home.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400">
          <Trans
            i18nKey="home.intro"
            components={{
              code: (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-800" />
              ),
            }}
          />
        </p>
      </div>
      <Counter />
    </div>
  )
}
