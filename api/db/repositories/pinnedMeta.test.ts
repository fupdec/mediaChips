import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { applySqlitePragmas } from '../pragmas'
import { createPinnedMetaRepository } from './pinnedMeta'
import * as schema from '../schema'

function createTestDb() {
  const sqlite = new Database(':memory:')
  applySqlitePragmas(sqlite)
  sqlite.exec(`
    CREATE TABLE meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      name TEXT,
      icon TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE pinnedMetas (
      metaId INTEGER NOT NULL,
      pinnedMetaId INTEGER NOT NULL,
      scraper TEXT,
      show INTEGER DEFAULT 1,
      "order" INTEGER,
      PRIMARY KEY(metaId, pinnedMetaId)
    );
  `)
  return {
    sqlite,
    drizzle: drizzle(sqlite, {schema}),
  }
}

describe('pinnedMeta repository', () => {
  let sqlite: Database.Database
  let db: ReturnType<typeof createTestDb>['drizzle']

  beforeEach(() => {
    const testDb = createTestDb()
    sqlite = testDb.sqlite
    db = testDb.drizzle

    const now = new Date().toISOString()
    sqlite.exec(`
      INSERT INTO meta (id, type, name, icon, createdAt, updatedAt) VALUES
        (1, 'array', 'Girls', 'account-group', '${now}', '${now}'),
        (2, 'string', 'Country', 'earth', '${now}', '${now}'),
        (3, 'date', 'Birthday', 'cake-variant', '${now}', '${now}');
      INSERT INTO pinnedMetas (metaId, pinnedMetaId, "order") VALUES
        (1, 2, 0),
        (1, 3, 1);
    `)
  })

  afterEach(() => {
    sqlite.close()
  })

  it('joins child meta fields when loading pinned children for a tag category', () => {
    const repo = createPinnedMetaRepository(db)
    const rows = repo.findAll({metaId: 1})

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.meta?.name)).toEqual(['Country', 'Birthday'])
  })

  it('joins parent tag categories when loading parents for a child field', () => {
    const repo = createPinnedMetaRepository(db)
    const rows = repo.findAllByPinnedMetaId(2)

    expect(rows).toHaveLength(1)
    expect(rows[0]?.meta?.name).toBe('Girls')
  })
})
