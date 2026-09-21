import { articlesModule } from './articles/index.js'
import { healthModule } from './health/index.js'
import { tagsModule } from './tags/index.js'
import { tasksModule } from './tasks/index.js'
import type { AppModule } from './types.js'

/** Add a new section of the app here; nothing else in the backend has to change. */
export const modules: AppModule[] = [healthModule, tasksModule, articlesModule, tagsModule]
