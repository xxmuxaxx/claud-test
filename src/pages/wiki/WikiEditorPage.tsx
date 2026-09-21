import { useParams } from 'react-router'
import { ArticleEditor } from '@/components/wiki/ArticleEditor'
import { ArticleNotFound } from '@/components/wiki/ArticleNotFound'
import { useWikiStore } from '@/store/useWikiStore'

/** Serves both `/wiki/new` (no `articleId`) and `/wiki/:articleId/edit`. */
export function WikiEditorPage() {
  const { articleId } = useParams()
  const { articles, status } = useWikiStore()

  if (status !== 'ready') return null
  if (articleId === undefined) return <ArticleEditor key="new" />

  const article = articles.find((item) => item.id === articleId)
  return article ? <ArticleEditor key={article.id} article={article} /> : <ArticleNotFound />
}
