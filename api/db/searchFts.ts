import type Database from 'better-sqlite3'

const FTS_BACKFILL_BATCH_SIZE = 2000

function hasTable(sqlite: Database.Database, tableName: string): boolean {
  const row = sqlite.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
  ).get(tableName) as {name: string} | undefined

  return Boolean(row)
}

function backfillMediaFts(sqlite: Database.Database) {
  const insert = sqlite.prepare(`INSERT INTO media_fts(rowid, name) VALUES (?, ?)`)
  const selectBatch = sqlite.prepare(`
    SELECT id, COALESCE(name, '') AS name
    FROM media
    WHERE id > ?
    ORDER BY id
    LIMIT ?
  `)

  let lastId = 0
  while (true) {
    const rows = selectBatch.all(lastId, FTS_BACKFILL_BATCH_SIZE) as Array<{id: number; name: string}>
    if (!rows.length) break

    const backfill = sqlite.transaction((batch: Array<{id: number; name: string}>) => {
      for (const row of batch) {
        insert.run(row.id, row.name)
      }
    })
    backfill(rows)
    lastId = rows[rows.length - 1].id
  }
}

function backfillTagsFts(sqlite: Database.Database) {
  const insert = sqlite.prepare(`INSERT INTO tags_fts(rowid, name, synonyms) VALUES (?, ?, ?)`)
  const selectBatch = sqlite.prepare(`
    SELECT id, COALESCE(name, '') AS name, COALESCE(synonyms, '') AS synonyms
    FROM tags
    WHERE id > ?
    ORDER BY id
    LIMIT ?
  `)

  let lastId = 0
  while (true) {
    const rows = selectBatch.all(lastId, FTS_BACKFILL_BATCH_SIZE) as Array<{
      id: number
      name: string
      synonyms: string
    }>
    if (!rows.length) break

    const backfill = sqlite.transaction((batch: Array<{id: number; name: string; synonyms: string}>) => {
      for (const row of batch) {
        insert.run(row.id, row.name, row.synonyms)
      }
    })
    backfill(rows)
    lastId = rows[rows.length - 1].id
  }
}

function createMediaFts(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE VIRTUAL TABLE media_fts USING fts5(
      name,
      tokenize='unicode61 remove_diacritics 2'
    );

    CREATE TRIGGER IF NOT EXISTS media_fts_insert AFTER INSERT ON media BEGIN
      INSERT INTO media_fts(rowid, name) VALUES (new.id, COALESCE(new.name, ''));
    END;

    CREATE TRIGGER IF NOT EXISTS media_fts_delete AFTER DELETE ON media BEGIN
      INSERT INTO media_fts(media_fts, rowid, name)
      VALUES ('delete', old.id, COALESCE(old.name, ''));
    END;

    CREATE TRIGGER IF NOT EXISTS media_fts_update AFTER UPDATE OF name ON media BEGIN
      INSERT INTO media_fts(media_fts, rowid, name)
      VALUES ('delete', old.id, COALESCE(old.name, ''));
      INSERT INTO media_fts(rowid, name) VALUES (new.id, COALESCE(new.name, ''));
    END;
  `)
  backfillMediaFts(sqlite)
}

function createTagsFts(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE VIRTUAL TABLE tags_fts USING fts5(
      name,
      synonyms,
      tokenize='unicode61 remove_diacritics 2'
    );

    CREATE TRIGGER IF NOT EXISTS tags_fts_insert AFTER INSERT ON tags BEGIN
      INSERT INTO tags_fts(rowid, name, synonyms)
      VALUES (new.id, COALESCE(new.name, ''), COALESCE(new.synonyms, ''));
    END;

    CREATE TRIGGER IF NOT EXISTS tags_fts_delete AFTER DELETE ON tags BEGIN
      INSERT INTO tags_fts(tags_fts, rowid, name, synonyms)
      VALUES ('delete', old.id, COALESCE(old.name, ''), COALESCE(old.synonyms, ''));
    END;

    CREATE TRIGGER IF NOT EXISTS tags_fts_update AFTER UPDATE OF name, synonyms ON tags BEGIN
      INSERT INTO tags_fts(tags_fts, rowid, name, synonyms)
      VALUES ('delete', old.id, COALESCE(old.name, ''), COALESCE(old.synonyms, ''));
      INSERT INTO tags_fts(rowid, name, synonyms)
      VALUES (new.id, COALESCE(new.name, ''), COALESCE(new.synonyms, ''));
    END;
  `)
  backfillTagsFts(sqlite)
}

export function ensureSearchFtsIndex(sqlite: Database.Database): string[] {
  const installed: string[] = []

  if (!hasTable(sqlite, 'media_fts')) {
    createMediaFts(sqlite)
    installed.push('media_fts')
  }

  if (!hasTable(sqlite, 'tags_fts')) {
    createTagsFts(sqlite)
    installed.push('tags_fts')
  }

  return installed
}

export function hasSearchFtsIndex(sqlite: Database.Database): boolean {
  return hasTable(sqlite, 'media_fts') && hasTable(sqlite, 'tags_fts')
}
