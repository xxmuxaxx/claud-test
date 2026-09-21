import 'dotenv/config'
import { loadConfig } from '../config/env.js'
import { createPrismaClient } from './prisma.js'
import { seedDatabase } from './seedData.js'

const prisma = createPrismaClient(loadConfig().databaseUrl)

try {
  const { tasks, articles } = await seedDatabase(prisma)
  console.log(
    tasks + articles === 0
      ? 'Seed skipped: the tables already contain data.'
      : `Seeded ${tasks} tasks and ${articles} articles.`,
  )
} finally {
  await prisma.$disconnect()
}
