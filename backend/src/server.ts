import 'dotenv/config'
import { buildApp } from './app.js'
import { loadConfig } from './config/env.js'
import { createPrismaClient } from './database/prisma.js'

async function main() {
  const config = loadConfig()
  const prisma = createPrismaClient(config.databaseUrl)
  const app = await buildApp({ config, prisma })

  async function shutdown(signal: string) {
    app.log.info(`${signal} received, shutting down`)
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  await app.listen({ port: config.port, host: config.host })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
