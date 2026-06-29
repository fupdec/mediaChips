import Database from 'better-sqlite3'
import { applySqlitePragmas } from './pragmas'
import { seedDefaults } from './seedDefaults'
import { seedDemoMetadata } from './seedDemoMetadata'
import { runLegacyUpgrades } from './legacyUpgrades'
import { repairSchemaColumns } from './schemaRepair'

export function runPostMigrations(dbPath: string) {
  const sqlite = new Database(dbPath)

  try {
    applySqlitePragmas(sqlite)
    seedDefaults(sqlite)
    seedDemoMetadata(sqlite)
    const repaired = repairSchemaColumns(sqlite)
    if (repaired.length) {
      console.log('\x1b[33m%s\x1b[0m', `⚙️ Repaired schema columns: ${repaired.join(', ')}`)
    }
    runLegacyUpgrades(sqlite)
  } finally {
    sqlite.close()
  }
}

module.exports = {runPostMigrations}
