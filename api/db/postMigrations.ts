import Database from 'better-sqlite3'
import { applySqlitePragmas } from './pragmas'
import { seedDefaults } from './seedDefaults'
import { seedDemoMetadata } from './seedDemoMetadata'
import { runLegacyUpgrades } from './legacyUpgrades'
import { repairSchemaColumns, repairMissingTables } from './schemaRepair'

export function runPostMigrations(dbPath: string) {
  const sqlite = new Database(dbPath)

  try {
    applySqlitePragmas(sqlite)
    seedDefaults(sqlite)
    seedDemoMetadata(sqlite)
    const repairedColumns = repairSchemaColumns(sqlite)
    if (repairedColumns.length) {
      console.log('\x1b[33m%s\x1b[0m', `⚙️ Repaired schema columns: ${repairedColumns.join(', ')}`)
    }
    const repairedTables = repairMissingTables(sqlite)
    if (repairedTables.length) {
      console.log('\x1b[33m%s\x1b[0m', `⚙️ Repaired schema tables: ${repairedTables.join(', ')}`)
    }
    runLegacyUpgrades(sqlite)
  } finally {
    sqlite.close()
  }
}

module.exports = {runPostMigrations}
