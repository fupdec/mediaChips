import Database from 'better-sqlite3'
import { applySqlitePragmas } from './pragmas'
import { seedDefaults } from './seedDefaults'
import { seedDemoMetadata } from './seedDemoMetadata'
import { runLegacyUpgrades } from './legacyUpgrades'

export function runPostMigrations(dbPath: string) {
  const sqlite = new Database(dbPath)

  try {
    applySqlitePragmas(sqlite)
    seedDefaults(sqlite)
    seedDemoMetadata(sqlite)
    runLegacyUpgrades(sqlite)
  } finally {
    sqlite.close()
  }
}

module.exports = {runPostMigrations}
