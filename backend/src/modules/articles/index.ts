import type { AppModule } from '../types.js'
import { ArticlesRepository } from './articles.repository.js'
import { articlesRoutes } from './articles.routes.js'
import { ArticlesService } from './articles.service.js'

export const articlesModule: AppModule = {
  name: 'articles',
  prefix: '/articles',
  plugin: async (app, { prisma }) => {
    const service = new ArticlesService(new ArticlesRepository(prisma))
    await app.register(articlesRoutes(service))
  },
}
