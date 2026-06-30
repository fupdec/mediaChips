/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import type { ApiDb } from '../types/db'
import { ensureSearchFtsIndex } from '../db/searchFts'
import { searchMediaByName, searchTagsByName } from './globalSearch'

function createSearchTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.exec(`
    CREATE TABLE media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      name TEXT,
      mediaTypeId INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE videoMetadata (
      mediaId INTEGER PRIMARY KEY,
      width INTEGER,
      height INTEGER
    );

    CREATE TABLE imageMetadata (
      mediaId INTEGER PRIMARY KEY,
      width INTEGER,
      height INTEGER
    );

    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      synonyms TEXT,
      metaId INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    INSERT INTO media (path, name, mediaTypeId, createdAt, updatedAt) VALUES
      ('/a.mp4', 'Action Hero', 1, '2024-01-01', '2024-01-01'),
      ('/b.mp4', 'Drama Night', 1, '2024-01-01', '2024-01-01');

    INSERT INTO tags (name, synonyms, metaId, createdAt, updatedAt) VALUES
      ('Actor', 'Performer', 1, '2024-01-01', '2024-01-01'),
      ('Director', NULL, 1, '2024-01-01', '2024-01-01');
  `)

  ensureSearchFtsIndex(sqlite)

  const db = { sqlite } as ApiDb

  return { sqlite, db }
}

describe('globalSearch FTS', () => {
  it('finds media by prefix using FTS', async () => {
    const { sqlite, db } = createSearchTestDb()

    try {
      const results = await searchMediaByName(db, 'act', 10) as Array<{ name?: string }>
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Action Hero')
    } finally {
      sqlite.close()
    }
  })

  it('finds tags by name or synonyms using FTS', async () => {
    const { sqlite, db } = createSearchTestDb()

    try {
      const byName = await searchTagsByName(db, 'act', 10) as Array<{ name?: string }>
      expect(byName.some((tag) => tag.name === 'Actor')).toBe(true)

      const bySynonym = await searchTagsByName(db, 'perform', 10) as Array<{ name?: string }>
      expect(bySynonym.some((tag) => tag.name === 'Actor')).toBe(true)
    } finally {
      sqlite.close()
    }
  })
})
