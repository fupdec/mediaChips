import type { ApiDb } from '../types/db'
import { queryAll } from '../db/utils/rawQuery'
import { buildFtsMatchQuery, isFtsSearchAvailable } from './ftsQuery'

const MAX_LIMIT = 200

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function normalizeLimit(value: unknown): number {
  const limit = Number(value)
  if (!Number.isFinite(limit) || limit <= 0) return 50
  return Math.min(Math.floor(limit), MAX_LIMIT)
}

async function searchMediaByNameLike(db: ApiDb, trimmed: string, sqlLimit: number) {
  const pattern = `%${escapeLikePattern(trimmed)}%`

  return queryAll(db, `SELECT media.*,
            COALESCE(videoMetadata.width, imageMetadata.width) AS width,
            COALESCE(videoMetadata.height, imageMetadata.height) AS height
     FROM media
              LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
              LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId
     WHERE media.name LIKE :pattern ESCAPE '\\'
     LIMIT :limit`, {pattern, limit: sqlLimit})
}

async function searchMediaByNameFts(db: ApiDb, matchQuery: string, sqlLimit: number) {
  return queryAll(db, `SELECT media.*,
            COALESCE(videoMetadata.width, imageMetadata.width) AS width,
            COALESCE(videoMetadata.height, imageMetadata.height) AS height
     FROM media_fts
              INNER JOIN media ON media.id = media_fts.rowid
              LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
              LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId
     WHERE media_fts MATCH :match
     ORDER BY bm25(media_fts)
     LIMIT :limit`, {match: matchQuery, limit: sqlLimit})
}

async function searchMediaByName(db: ApiDb, query: string, limit: unknown) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const sqlLimit = normalizeLimit(limit)
  const matchQuery = buildFtsMatchQuery(trimmed)

  if (matchQuery && isFtsSearchAvailable(db.sqlite)) {
    try {
      return await searchMediaByNameFts(db, matchQuery, sqlLimit)
    } catch {
      // Fall back to LIKE when FTS query syntax is invalid.
    }
  }

  return searchMediaByNameLike(db, trimmed, sqlLimit)
}

async function searchTagsByNameLike(db: ApiDb, trimmed: string, sqlLimit: number) {
  const pattern = `%${escapeLikePattern(trimmed)}%`

  return queryAll(db, `SELECT *
     FROM tags
     WHERE name LIKE :pattern ESCAPE '\\'
        OR synonyms LIKE :pattern ESCAPE '\\'
     LIMIT :limit`, {pattern, limit: sqlLimit})
}

async function searchTagsByNameFts(db: ApiDb, matchQuery: string, sqlLimit: number) {
  return queryAll(db, `SELECT tags.*
     FROM tags_fts
              INNER JOIN tags ON tags.id = tags_fts.rowid
     WHERE tags_fts MATCH :match
     ORDER BY bm25(tags_fts)
     LIMIT :limit`, {match: matchQuery, limit: sqlLimit})
}

async function searchTagsByName(db: ApiDb, query: string, limit: unknown) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const sqlLimit = normalizeLimit(limit)
  const matchQuery = buildFtsMatchQuery(trimmed)

  if (matchQuery && isFtsSearchAvailable(db.sqlite)) {
    try {
      return await searchTagsByNameFts(db, matchQuery, sqlLimit)
    } catch {
      // Fall back to LIKE when FTS query syntax is invalid.
    }
  }

  return searchTagsByNameLike(db, trimmed, sqlLimit)
}

export { searchMediaByName, searchTagsByName, MAX_LIMIT }
