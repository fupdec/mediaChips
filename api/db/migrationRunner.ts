const {runDrizzleMigrations, resetSqliteDatabase} = require('./drizzleMigrations')
const {runPostMigrations} = require('./postMigrations')

export async function bootstrapDatabase(dbPath: string) {
  runDrizzleMigrations(dbPath)
  runPostMigrations(dbPath)
}

export async function resetDatabaseAndRunMigrations(dbPath: string) {
  resetSqliteDatabase(dbPath)
  runDrizzleMigrations(dbPath)
  runPostMigrations(dbPath)
}

module.exports = {
  bootstrapDatabase,
  resetDatabaseAndRunMigrations,
}
