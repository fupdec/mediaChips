/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { ensureSearchFtsIndex, hasSearchFtsIndex } from './searchFts'

describe('ensureSearchFtsIndex', () => {
  it('creates FTS tables and keeps them in sync via triggers', () => {
    const sqlite = new Database(':memory:')
    sqlite.exec(`
      CREATE TABLE media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      );
      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        synonyms TEXT
      );
    `)

    const installed = ensureSearchFtsIndex(sqlite)
    expect(installed).toEqual(['media_fts', 'tags_fts'])
    expect(hasSearchFtsIndex(sqlite)).toBe(true)

    sqlite.prepare(`INSERT INTO media (id, name) VALUES (?, ?)`).run(1, 'Alpha')
    sqlite.prepare(`INSERT INTO tags (id, name, synonyms) VALUES (?, ?, ?)`).run(1, 'Beta', 'Gamma')

    expect(sqlite.prepare(`SELECT rowid FROM media_fts WHERE media_fts MATCH '"alp"*'`).all()).toHaveLength(1)
    expect(sqlite.prepare(`SELECT rowid FROM tags_fts WHERE tags_fts MATCH '"gam"*'`).all()).toHaveLength(1)

    const installedAgain = ensureSearchFtsIndex(sqlite)
    expect(installedAgain).toEqual([])
    sqlite.close()
  })
})
