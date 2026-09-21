import { useParams } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { ArticleEditor } from '@/components/wiki/ArticleEditor'
import { ArticleNotFound } from '@/components/wiki/ArticleNotFound'
import { ArticlePageSkeleton } from '@/components/wiki/WikiSkeletons'
import { useArticle } from '@/hooks/useArticles'

/** Serves both `/wiki/new` (no `articleId`) and `/wiki/:articleId/edit`. */
export function WikiEditorPage() {
  const { articleId } = useParams()
  return articleId === undefined ? <ArticleEditor key="new" /> : <EditExisting id={articleId} />
}

function EditExisting({ id }: { id: string }) {
  const { data: article, status, error, reload } = useArticle(id)

  if (status === 'error') return <ErrorNotice error={error} onRetry={reload} />
  if (article === undefined) return <ArticlePageSkeleton />
  if (article === null) return <ArticleNotFound />
  return <ArticleEditor key={article.id} article={article} />
}
