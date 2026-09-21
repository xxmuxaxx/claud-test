import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

/** Applies the real migrations, so the tests run against the schema production gets. */
function migrate(databaseUrl: string) {
  const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js')
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  })
}

/**
 * Tests need a real PostgreSQL. Set TEST_DATABASE_URL to use your own (it is wiped by the tests!);
 * otherwise a throw-away PostgreSQL is started from the `embedded-postgres` package —
 * no Docker or local installation required.
 */
export default async function setup(project: TestProject) {
  const externalUrl = process.env['TEST_DATABASE_URL']
  if (externalUrl) {
    migrate(externalUrl)
    project.provide('databaseUrl', externalUrl)
    return
  }

  const databaseDir = await mkdtemp(join(tmpdir(), 'app-test-pg-'))
  const port = await freePort()
  const postgres = new EmbeddedPostgres({
    databaseDir,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  })
  await postgres.initialise()
  await postgres.start()
  await postgres.createDatabase('app_test')

  const databaseUrl = `postgresql://postgres:postgres@localhost:${port}/app_test`
  migrate(databaseUrl)
  project.provide('databaseUrl', databaseUrl)

  return async () => {
    await postgres.stop()
    await rm(databaseDir, { recursive: true, force: true })
  }
}
