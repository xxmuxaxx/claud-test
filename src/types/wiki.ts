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

/** Everything the user edits; `id` and timestamps are assigned by the storage layer. */
export type WikiArticleInput = Omit<WikiArticle, 'id' | 'createdAt' | 'updatedAt'>
