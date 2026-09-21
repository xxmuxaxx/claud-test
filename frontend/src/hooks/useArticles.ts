import { useCallback } from 'react'
import { articlesApi } from '@/api/articlesApi'
import type { WikiListQuery } from '@/types/wiki'
import { useAsyncData } from './useAsyncData'

/** Articles matching a search and/or a tag. The previous list stays visible while typing. */
export function useArticleList({ search, tag }: WikiListQuery) {
  const fetcher = useCallback(() => articlesApi.list({ search, tag }), [search, tag])
  return useAsyncData(fetcher, { keepPrevious: true })
}

/** One article; `data` is `null` when it does not exist. */
export function useArticle(id: string) {
  const fetcher = useCallback(() => articlesApi.get(id), [id])
  return useAsyncData(fetcher)
}

/** Related articles are a nicety: if the request fails the article is shown without them. */
export function useRelatedArticles(id: string) {
  const fetcher = useCallback(() => articlesApi.related(id).catch(() => []), [id])
  return useAsyncData(fetcher)
}
