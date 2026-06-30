import type { ApiDb } from '../types/db'
import { queryAll } from '../db/utils/rawQuery'
import {
  buildFtsMatchQuery,
  buildTagFtsMatchQuery,
  isFtsSearchAvailable,
  matchesGlobalSearchName,
  resolveGlobalSearchTagMatch,
  type GlobalSearchTagResult,
} from './ftsQuery'

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

const MEDIA_SEARCH_SELECT = `SELECT media.id,
            media.name,
            media.mediaTypeId,
            media.path,
            COALESCE(videoMetadata.width, imageMetadata.width) AS width,
            COALESCE(videoMetadata.height, imageMetadata.height) AS height`

const TAG_SEARCH_SELECT = `SELECT tags.id,
            tags.name,
            tags.metaId,
            tags.synonyms`

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function normalizeLimit(value: unknown): number {
  const limit = Number(value)
  if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_LIMIT
  return Math.min(Math.floor(limit), MAX_LIMIT)
}

async function searchMediaByNameLike(db: ApiDb, trimmed: string, sqlLimit: number) {
  const pattern = `%${escapeLikePattern(trimmed)}%`

  return queryAll(db, `${MEDIA_SEARCH_SELECT}
     FROM media
              LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
              LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId
     WHERE media.name LIKE :pattern ESCAPE '\\'
     LIMIT :limit`, {pattern, limit: sqlLimit})
}

async function searchMediaByNameFts(db: ApiDb, matchQuery: string, sqlLimit: number) {
  return queryAll(db, `${MEDIA_SEARCH_SELECT}
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

  let rows: Array<Record<string, unknown>> = []

  if (matchQuery && isFtsSearchAvailable(db.sqlite)) {
    try {
      rows = await searchMediaByNameFts(db, matchQuery, sqlLimit)
    } catch {
      // Fall back to LIKE when FTS query syntax is invalid.
    }
  }

  if (!rows.length) {
    rows = await searchMediaByNameLike(db, trimmed, sqlLimit)
  }

  return rows.filter((row) => matchesGlobalSearchName(String(row.name || ''), trimmed))
}

async function searchTagsByNameLike(db: ApiDb, trimmed: string, sqlLimit: number) {
  const pattern = `%${escapeLikePattern(trimmed)}%`

  return queryAll(db, `${TAG_SEARCH_SELECT}
     FROM tags
     WHERE name LIKE :pattern ESCAPE '\\'
        OR synonyms LIKE :pattern ESCAPE '\\'
     LIMIT :limit`, {pattern, limit: sqlLimit})
}

async function searchTagsByNameFts(db: ApiDb, matchQuery: string, sqlLimit: number) {
  return queryAll(db, `${TAG_SEARCH_SELECT}
     FROM tags_fts
              INNER JOIN tags ON tags.id = tags_fts.rowid
     WHERE tags_fts MATCH :match
     ORDER BY bm25(tags_fts)
     LIMIT :limit`, {match: matchQuery, limit: sqlLimit})
}

function enrichTagSearchRow(row: Record<string, unknown>, trimmed: string): GlobalSearchTagResult | null {
  const resolved = resolveGlobalSearchTagMatch(
    String(row.name || ''),
    row.synonyms == null ? '' : String(row.synonyms),
    trimmed,
  )

  if (!resolved.matched || !resolved.matchSource) return null

  return {
    id: Number(row.id),
    name: row.name == null ? null : String(row.name),
    metaId: row.metaId == null ? null : Number(row.metaId),
    synonyms: row.synonyms == null ? null : String(row.synonyms),
    matchSource: resolved.matchSource,
    matchedSynonyms: resolved.matchedSynonyms.length ? resolved.matchedSynonyms : undefined,
  }
}

async function searchTagsByName(db: ApiDb, query: string, limit: unknown): Promise<GlobalSearchTagResult[]> {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const sqlLimit = normalizeLimit(limit)
  const matchQuery = buildTagFtsMatchQuery(trimmed)

  let rows: Array<Record<string, unknown>> = []

  if (matchQuery && isFtsSearchAvailable(db.sqlite)) {
    try {
      rows = await searchTagsByNameFts(db, matchQuery, sqlLimit)
    } catch {
      // Fall back to LIKE when FTS query syntax is invalid.
    }
  }

  if (!rows.length) {
    rows = await searchTagsByNameLike(db, trimmed, sqlLimit)
  }

  return rows
    .map((row) => enrichTagSearchRow(row, trimmed))
    .filter((row): row is NonNullable<typeof row> => row != null)
}

async function searchGlobal(db: ApiDb, query: string, limit: unknown) {
  const [media, tags] = await Promise.all([
    searchMediaByName(db, query, limit),
    searchTagsByName(db, query, limit),
  ])

  return { media, tags }
}

export {
  searchMediaByName,
  searchTagsByName,
  searchGlobal,
  MAX_LIMIT,
  DEFAULT_LIMIT,
}
