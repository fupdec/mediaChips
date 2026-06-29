import type { ApiDb } from '../../api/types/db'
import type { ServerDatabaseEntry } from '../types/server'
import { apiErrorMessage } from '../../api/types/errors'
const path = require('path')
const {createDrizzleClient, smokeTestDrizzle} = require('../../api/db')
const createApiDb = require('../../api')
const {bootstrapDatabase} = require('../../api/db/migrationRunner')

function setupDatabase({databasesPath, dbConfig}: { databasesPath: string; dbConfig: ServerDatabaseEntry | undefined }) {
  if (!dbConfig) {
    console.error('\x1b[31m%s\x1b[0m', '❌ No active database to connect to!')
    process.exit(1)
  }

  console.log('\x1b[36m%s\x1b[0m', `Connecting to database: ${dbConfig.name} (${dbConfig.id})`)

  const dbPath = path.join(databasesPath, dbConfig.id, 'db.sqlite')
  const drizzleConnection = createDrizzleClient(dbPath)

  const db = createApiDb({
    drizzleConnection,
    config: dbConfig,
    path: path.join(databasesPath, dbConfig.id),
    path_databases: databasesPath,
  }) as ApiDb

  console.log('\x1b[36m%s\x1b[0m', '✅ Database connection successful')
  console.log('\x1b[36m%s\x1b[0m', `Database ID: ${db.config?.id}`)

  bootstrapDatabase(dbPath).then(() => {
    console.log('\x1b[36m%s\x1b[0m', '✅ Database synchronized')
    console.log('\x1b[32m%s\x1b[0m', '✅ Migrations applied')

    const mediaCount = smokeTestDrizzle(db.drizzle)
    console.log('\x1b[32m%s\x1b[0m', `✅ Drizzle connected (${mediaCount} media rows)`)
  }).catch((err: unknown) => {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Database bootstrap error:', err instanceof Error ? apiErrorMessage(err) : String(err))
  })

  return {db, drizzleConnection}
}

function warmupEmbeddingModel(db: ApiDb) {
  try {
    const embeddingModel = require('../../api/services/embeddingModel')
    embeddingModel.loadModel(db).catch((err: unknown) => {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup skipped:', err instanceof Error ? apiErrorMessage(err) : String(err))
    })
  } catch (err: unknown) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup unavailable:', err instanceof Error ? apiErrorMessage(err) : String(err))
  }
}

module.exports = {
  setupDatabase,
  warmupEmbeddingModel,
}
