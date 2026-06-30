/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { createMediaRepository } from './media'

describe('media repository folder path queries', () => {
  it('limits path entries to rows under the watched folder prefix', () => {
    const sqlite = new Database(':memory:')
    sqlite.exec(`
      CREATE TABLE media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        mediaTypeId INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      INSERT INTO media (path, mediaTypeId, createdAt, updatedAt) VALUES
        ('/watched/a.mp4', 10, '2024-01-01', '2024-01-01'),
        ('/watched/nested/b.mp4', 10, '2024-01-01', '2024-01-01'),
        ('/other/c.mp4', 10, '2024-01-01', '2024-01-01'),
        ('/watched/a.mkv', 11, '2024-01-01', '2024-01-01');
    `)

    const repo = createMediaRepository(drizzle(sqlite))
    const rows = repo.findPathEntriesByMediaTypeIdsUnderFolder([10, 11], '/watched')

    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.path).sort((a, b) => a.localeCompare(b))).toEqual([
      '/watched/a.mkv',
      '/watched/a.mp4',
      '/watched/nested/b.mp4',
    ])
    sqlite.close()
  })
})
