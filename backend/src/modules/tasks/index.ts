import type { AppModule } from '../types.js'
import { TasksRepository } from './tasks.repository.js'
import { tasksRoutes } from './tasks.routes.js'
import { TasksService } from './tasks.service.js'

export const tasksModule: AppModule = {
  name: 'tasks',
  prefix: '/tasks',
  plugin: async (app, { prisma }) => {
    const service = new TasksService(new TasksRepository(prisma))
    await app.register(tasksRoutes(service))
  },
}
