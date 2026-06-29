import type { ApiDb } from './types/db'
import type { DrizzleConnection } from './db/client'

export type CreateApiDbOptions = {
  drizzleConnection: DrizzleConnection
  config?: ApiDb['config']
  path?: string
  path_databases?: string
}

export function createApiDb(options: CreateApiDbOptions): ApiDb {
  const {drizzleConnection, config, path: dbPath, path_databases} = options

  return {
    config,
    path: dbPath,
    path_databases,
    drizzle: drizzleConnection.drizzle,
    sqlite: drizzleConnection.sqlite,
  }
}

module.exports = {createApiDb}
