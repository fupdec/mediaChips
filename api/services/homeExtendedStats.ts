import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

async function getHomeExtendedStats(db: ApiDb) {
  const total = await db.Media.count()

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

  const [byType] = await db.sequelize.query(`
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

  const [[ratingRow]] = await db.sequelize.query(`
    SELECT AVG(rating) AS avg
    FROM media
    WHERE rating > 0
  `)

  const [[tagsRow]] = await db.sequelize.query(`
    SELECT COUNT(DISTINCT mediaId) AS count
    FROM tagsInMedia
  `)

  const [[ratedRow]] = await db.sequelize.query(`
    SELECT COUNT(*) AS count
    FROM media
    WHERE rating > 0
  `)

  const [[favoritesRow]] = await db.sequelize.query(`
    SELECT COUNT(*) AS count
    FROM media
    WHERE favorite = 1
  `)

  const [[weekRow]] = await db.sequelize.query(`
    SELECT COUNT(*) AS count
    FROM media
    WHERE createdAt >= datetime('now', '-7 days')
  `)

  const [[monthRow]] = await db.sequelize.query(`
    SELECT COUNT(*) AS count
    FROM media
    WHERE createdAt >= datetime('now', '-30 days')
  `)

  const [largestFiles] = await db.sequelize.query(`
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
  }
}

module.exports = {
  getHomeExtendedStats,
}
