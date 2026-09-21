import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { ArticleNotFound } from '@/components/wiki/ArticleNotFound'
import { DeleteArticleDialog } from '@/components/wiki/DeleteArticleDialog'
import { MarkdownView } from '@/components/wiki/MarkdownView'
import { RelatedArticles } from '@/components/wiki/RelatedArticles'
import { TagList } from '@/components/wiki/TagList'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { formatFullDate } from '@/lib/dates'
import { getRelatedArticles } from '@/lib/wiki'
import { useWikiStore } from '@/store/useWikiStore'

export function WikiArticlePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { articleId } = useParams()
  const { articles, status, removeArticle } = useWikiStore()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const article = articles.find((item) => item.id === articleId)
  const related = useMemo(
    () => (article ? getRelatedArticles(articles, article) : []),
    [articles, article],
  )

  if (status !== 'ready') return null
  if (!article) return <ArticleNotFound />

  async function handleDelete() {
    if (!article) return
    await removeArticle(article.id)
    void navigate('/wiki')
  }

  return (
    <article className="mx-auto max-w-2xl">
      <header className="space-y-4 pb-8">
        <h1 className="text-4xl leading-tight font-bold tracking-tight break-words sm:text-5xl">
          {article.title}
        </h1>
        {article.description && (
          <p className="text-xl leading-8 text-slate-600 dark:text-slate-400">
            {article.description}
          </p>
        )}
        <TagList tags={article.tags} linked />
      </header>

      <hr className="border-slate-200 dark:border-slate-800" />

      <div className="py-10">
        <MarkdownView>{article.content}</MarkdownView>
      </div>

      <hr className="border-slate-200 dark:border-slate-800" />

      <footer className="space-y-6 pt-6 pb-10">
        <dl className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
          <div>{t('wiki.created', { date: formatFullDate(article.createdAt, i18n.language) })}</div>
          <div>
            {t('wiki.modified', { date: formatFullDate(article.updatedAt, i18n.language) })}
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Link to={`/wiki/${article.id}/edit`} className={buttonClass('secondary')}>
            <Pencil className="size-4" aria-hidden />
            {t('wiki.article.edit')}
          </Link>
          <Button variant="secondary" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="size-4" aria-hidden />
            {t('wiki.article.delete')}
          </Button>
        </div>
      </footer>

      <RelatedArticles articles={related} />

      {confirmingDelete && (
        <DeleteArticleDialog
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </article>
  )
}
