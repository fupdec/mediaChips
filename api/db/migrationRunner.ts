import { runDrizzleMigrations, resetSqliteDatabase } from './drizzleMigrations'
import { runPostMigrations } from './postMigrations'

export async function bootstrapDatabase(dbPath: string) {
  runDrizzleMigrations(dbPath)
  runPostMigrations(dbPath)
}

export async function resetDatabaseAndRunMigrations(dbPath: string) {
  resetSqliteDatabase(dbPath)
  runDrizzleMigrations(dbPath)
  runPostMigrations(dbPath)
}

