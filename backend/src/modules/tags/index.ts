import type { AppModule } from '../types.js'
import { TagsRepository } from './tags.repository.js'
import { tagsRoutes } from './tags.routes.js'
import { TagsService } from './tags.service.js'

/** Read-only view of the tags the wiki articles use; articles own the links (see the schema). */
export const tagsModule: AppModule = {
  name: 'tags',
  prefix: '/tags',
  plugin: async (app, { prisma }) => {
    const service = new TagsService(new TagsRepository(prisma))
    await app.register(tagsRoutes(service))
  },
}
