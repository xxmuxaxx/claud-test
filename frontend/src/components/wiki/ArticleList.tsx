import { useTranslation } from 'react-i18next'
import type { WikiArticle } from '@/types/wiki'
import { ArticleCard } from './ArticleCard'

export function ArticleList({ articles }: { articles: readonly WikiArticle[] }) {
  const { t } = useTranslation()

  if (articles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {t('wiki.nothingFound')}
      </p>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {articles.map((article) => (
        <li key={article.id}>
          <ArticleCard article={article} />
        </li>
      ))}
    </ul>
  )
}
