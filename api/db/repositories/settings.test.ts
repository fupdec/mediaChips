import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { applySqlitePragmas } from '../pragmas'
import { createSettingsRepository } from './settings'
import * as schema from '../schema'

function createTestDb() {
  const sqlite = new Database(':memory:')
  applySqlitePragmas(sqlite)
  sqlite.exec(`
    CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option TEXT UNIQUE,
      value TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  return {
    sqlite,
    drizzle: drizzle(sqlite, {schema}),
  }
}

describe('settings repository', () => {
  let sqlite: Database.Database
  let db: ReturnType<typeof createTestDb>['drizzle']

  beforeEach(() => {
    const testDb = createTestDb()
    sqlite = testDb.sqlite
    db = testDb.drizzle
  })

  afterEach(() => {
    sqlite.close()
  })

  it('upserts and reads settings by option', () => {
    const repo = createSettingsRepository(db)

    expect(repo.findAll()).toEqual([])

    const created = repo.upsertByOption('theme', 'dark')
    expect(created.created).toBe(true)
    expect(repo.findByOption('theme')?.value).toBe('dark')

    const updated = repo.upsertByOption('theme', 'light')
    expect(updated.created).toBe(false)
    expect(repo.findByOption('theme')?.value).toBe('light')
  })

  it('loads settings by option list', () => {
    const repo = createSettingsRepository(db)
    repo.upsertByOption('pathParser.useML', '1')
    repo.upsertByOption('other', '0')

    const rows = repo.findByOptions(['pathParser.useML', 'missing'])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.option).toBe('pathParser.useML')
  })
})
