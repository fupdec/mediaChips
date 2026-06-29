import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { applySqlitePragmas } from './pragmas'
import { smokeTestDrizzle } from './smoke'
import * as schema from './schema'

describe('drizzle client', () => {
  let sqlite: Database.Database
  let db: ReturnType<typeof drizzle<typeof schema>>

  beforeEach(() => {
    sqlite = new Database(':memory:')
    applySqlitePragmas(sqlite)
    sqlite.exec(`
      CREATE TABLE media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL
      )
    `)
    db = drizzle(sqlite, {schema})
  })

  afterEach(() => {
    sqlite.close()
  })

  it('applies foreign_keys pragma', () => {
    const row = sqlite.pragma('foreign_keys', {simple: true}) as number
    expect(row).toBe(1)
  })

  it('counts media rows via smoke test', () => {
    sqlite.exec(`INSERT INTO media (path) VALUES ('/videos/sample.mp4')`)
    expect(smokeTestDrizzle(db)).toBe(1)
  })
})
