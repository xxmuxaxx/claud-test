import type { TagsRepository, TagUsage } from './tags.repository.js'

export class TagsService {
  constructor(private readonly repository: TagsRepository) {}

  /** Most used first, then alphabetically. */
  async list(): Promise<TagUsage[]> {
    const tags = await this.repository.listUsed()
    return tags.sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name))
  }
}
