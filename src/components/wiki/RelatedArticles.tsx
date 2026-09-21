import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import type { WikiArticle } from '@/types/wiki'

export function RelatedArticles({ articles }: { articles: readonly WikiArticle[] }) {
  const { t } = useTranslation()
  if (articles.length === 0) return null

  return (
    <section aria-labelledby="related-articles" className="space-y-3">
      <h2 id="related-articles" className="text-lg font-semibold tracking-tight">
        {t('wiki.article.related')}
      </h2>
      <ul className="space-y-1">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              to={`/wiki/${article.id}`}
              className="group inline-flex items-center gap-2 text-brand-600 hover:underline dark:text-brand-400"
            >
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
