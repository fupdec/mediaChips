import type Database from 'better-sqlite3'

export function applySqlitePragmas(sqlite: Database.Database) {
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  sqlite.pragma('temp_store = MEMORY')
  sqlite.pragma('cache_size = -64000')
}
