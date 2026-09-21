import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/buttonClass'

export function ArticleNotFound() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{t('wiki.article.notFound.title')}</h1>
      <p className="text-slate-500 dark:text-slate-400">{t('wiki.article.notFound.hint')}</p>
      <Link to="/wiki" className={buttonClass('secondary')}>
        {t('wiki.allArticles')}
      </Link>
    </div>
  )
}
