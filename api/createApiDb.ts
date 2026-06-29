import type { ApiDb } from './types/db'
import type { DrizzleConnection } from './db/client'
import { setActiveConnection, getDrizzleProxy, getSqliteProxy } from './db/connectionHolder'

export type CreateApiDbOptions = {
  drizzleConnection: DrizzleConnection
  config?: ApiDb['config']
  path?: string
  path_databases?: string
}

export function createApiDb(options: CreateApiDbOptions): ApiDb {
  const {drizzleConnection, config, path: dbPath, path_databases} = options

  setActiveConnection(drizzleConnection)

  return {
    config,
    path: dbPath,
    path_databases,
    drizzle: getDrizzleProxy(),
    sqlite: getSqliteProxy(),
  }
}

export { createApiDb as default }

module.exports = { createApiDb }
