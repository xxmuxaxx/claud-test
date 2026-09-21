import type { TagCount } from '@/types/wiki'
import { apiRequest } from './http'

export const tagsApi = {
  /** Tags used by at least one article, most used first. */
  async list(): Promise<TagCount[]> {
    const tags = await apiRequest<{ name: string; articleCount: number }[]>('GET', '/tags')
    return tags.map(({ name, articleCount }) => ({ tag: name, count: articleCount }))
  },
}
