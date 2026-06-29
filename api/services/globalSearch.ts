import type { ApiDb } from '../types/db'

const MAX_LIMIT = 200

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function normalizeLimit(value: unknown): number {
  const limit = Number(value)
  if (!Number.isFinite(limit) || limit <= 0) return 50
  return Math.min(Math.floor(limit), MAX_LIMIT)
}

async function searchMediaByName(db: ApiDb, query: string, limit: unknown) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const pattern = `%${escapeLikePattern(trimmed)}%`
  const sqlLimit = normalizeLimit(limit)

  const [rows] = await db.sequelize.query(
    `SELECT media.*,
            COALESCE(videoMetadata.width, imageMetadata.width) AS width,
            COALESCE(videoMetadata.height, imageMetadata.height) AS height
     FROM media
              LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
              LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId
     WHERE media.name LIKE :pattern ESCAPE '\\'
     LIMIT :limit`,
    {
      replacements: {pattern, limit: sqlLimit},
    },
  )

  return rows
}

async function searchTagsByName(db: ApiDb, query: string, limit: unknown) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const pattern = `%${escapeLikePattern(trimmed)}%`
  const sqlLimit = normalizeLimit(limit)

  const [rows] = await db.sequelize.query(
    `SELECT *
     FROM tags
     WHERE name LIKE :pattern ESCAPE '\\'
        OR synonyms LIKE :pattern ESCAPE '\\'
     LIMIT :limit`,
    {
      replacements: {pattern, limit: sqlLimit},
    },
  )

  return rows
}

module.exports = {
  searchMediaByName,
  searchTagsByName,
  MAX_LIMIT,
}
