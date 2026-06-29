import type { ApiDb, AnyRecord } from '../types/db'
import type { ParsedExtendedStats } from '@shared/schemas/home'

const {queryAll, queryGet} = require('../db/utils/rawQuery')
const {createMediaRepository} = require('../db/repositories/media')

async function getHomeExtendedStats(db: ApiDb): Promise<ParsedExtendedStats> {
  const mediaRepo = createMediaRepository(db.drizzle)
  const total = mediaRepo.countAll()

  if (!total) {
    return {
      total: 0,
      byType: [],
      averageRating: 0,
      withTags: 0,
      rated: 0,
      favorites: 0,
      addedLast7Days: 0,
      addedLast30Days: 0,
      largestFiles: [],
    }
  }

  const byType = queryAll(db, `
    SELECT
      media.mediaTypeId,
      mediaTypes.name,
      mediaTypes.icon,
      mediaTypes.type,
      COUNT(*) AS count,
      COALESCE(SUM(media.filesize), 0) AS filesize
    FROM media
    INNER JOIN mediaTypes ON media.mediaTypeId = mediaTypes.id
    GROUP BY media.mediaTypeId, mediaTypes.name, mediaTypes.icon, mediaTypes.type
    ORDER BY count DESC
  `)

  const ratingRow = queryGet(db, `
    SELECT AVG(rating) AS avg
    FROM media
    WHERE rating > 0
  `) as {avg?: number} | undefined

  const tagsRow = queryGet(db, `
    SELECT COUNT(DISTINCT mediaId) AS count
    FROM tagsInMedia
  `) as {count?: number} | undefined

  const ratedRow = queryGet(db, `
    SELECT COUNT(*) AS count
    FROM media
    WHERE rating > 0
  `) as {count?: number} | undefined

  const favoritesRow = queryGet(db, `
    SELECT COUNT(*) AS count
    FROM media
    WHERE favorite = 1
  `) as {count?: number} | undefined

  const weekRow = queryGet(db, `
    SELECT COUNT(*) AS count
    FROM media
    WHERE createdAt >= datetime('now', '-7 days')
  `) as {count?: number} | undefined

  const monthRow = queryGet(db, `
    SELECT COUNT(*) AS count
    FROM media
    WHERE createdAt >= datetime('now', '-30 days')
  `) as {count?: number} | undefined

  const largestFiles = queryAll(db, `
    SELECT id, name, basename, filesize, mediaTypeId
    FROM media
    WHERE filesize > 0
    ORDER BY filesize DESC
    LIMIT 5
  `)

  return {
    total,
    byType: byType.map((row: AnyRecord) => ({
      mediaTypeId: row.mediaTypeId,
      name: row.name,
      icon: row.icon,
      type: row.type,
      count: Number(row.count || 0),
      filesize: Number(row.filesize || 0),
    })),
    averageRating: Number(ratingRow?.avg || 0),
    withTags: Number(tagsRow?.count || 0),
    rated: Number(ratedRow?.count || 0),
    favorites: Number(favoritesRow?.count || 0),
    addedLast7Days: Number(weekRow?.count || 0),
    addedLast30Days: Number(monthRow?.count || 0),
    largestFiles,
  } as unknown as ParsedExtendedStats
}

module.exports = {
  getHomeExtendedStats,
}
