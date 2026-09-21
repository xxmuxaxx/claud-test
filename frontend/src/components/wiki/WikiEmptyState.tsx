import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/buttonClass'

export function WikiEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5 rounded-2xl border border-dashed border-slate-300 px-4 py-16 text-center dark:border-slate-700">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t('wiki.empty.title')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('wiki.empty.hint')}</p>
      </div>
      <Link to="/wiki/new" className={buttonClass()}>
        {t('wiki.create')}
      </Link>
    </div>
  )
}
