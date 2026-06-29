import type { DatabaseManager } from './databaseManager'

let databaseManager: DatabaseManager | null = null

function initDatabaseManager(manager: DatabaseManager) {
  databaseManager = manager
}

function getDatabaseManager(): DatabaseManager {
  if (!databaseManager) {
    throw new Error('Database manager is not initialized')
  }
  return databaseManager
}

export { initDatabaseManager, getDatabaseManager }
