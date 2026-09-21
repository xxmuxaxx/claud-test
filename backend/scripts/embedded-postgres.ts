/**
 * Local PostgreSQL without Docker or an installation: runs a real PostgreSQL server from the
 * `embedded-postgres` package and keeps its data in `backend/.pgdata`. Matches `.env.example`
 * (user `app`, password `app`, database `app`, port 5432). Stop it with Ctrl+C.
 */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'

const port = Number(process.env['EMBEDDED_PG_PORT'] ?? 5432)
const databaseDir = resolve(import.meta.dirname, '..', '.pgdata')

const postgres = new EmbeddedPostgres({
  databaseDir,
  user: 'app',
  password: 'app',
  port,
  persistent: true,
})

if (!existsSync(join(databaseDir, 'PG_VERSION'))) await postgres.initialise()
await postgres.start()
try {
  await postgres.createDatabase('app')
} catch {
  // The database exists already.
}
console.log(`PostgreSQL is ready: postgresql://app:app@localhost:${port}/app (Ctrl+C to stop)`)

async function stop() {
  await postgres.stop()
  process.exit(0)
}
process.on('SIGINT', () => void stop())
process.on('SIGTERM', () => void stop())
