import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p className="text-slate-600 dark:text-slate-400">{t('notFound.message')}</p>
      <Link to="/" className="text-brand-600 hover:underline dark:text-brand-400">
        {t('notFound.back')}
      </Link>
    </div>
  )
}
