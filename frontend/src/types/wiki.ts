export interface WikiArticle {
  id: string
  title: string
  description?: string
  /** Markdown source. */
  content: string
  /** Normalized (lowercase, no `#`), unique. */
  tags: string[]
  /** ISO 8601 timestamps. */
  createdAt: string
  updatedAt: string
}

/** Everything the user edits; `id` and timestamps are assigned by the backend. */
export type WikiArticleInput = Omit<WikiArticle, 'id' | 'createdAt' | 'updatedAt'>

/** A tag with the number of articles that use it. */
export interface TagCount {
  tag: string
  count: number
}

/** What narrows down the article list; the backend does the searching and filtering. */
export interface WikiListQuery {
  search?: string
  tag?: string
}
