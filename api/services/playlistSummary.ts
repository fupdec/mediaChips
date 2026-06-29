import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'
import type { ParsedDynamicPlaylistSummary } from '@shared/schemas/filters'

async function getManualPlaylistsSummary(db: ApiDb): Promise<ParsedDynamicPlaylistSummary[]> {
  const playlists = await db.Playlist.findAll({
    order: [['name', 'ASC']],
    raw: true,
  })

  if (!playlists.length) return []

  const [rows] = await db.sequelize.query(
    `SELECT
      mip.playlistId,
      mip.mediaId,
      mip.\`order\`,
      media.id,
      media.path,
      media.name,
      media.basename,
      media.ext,
      media.mediaTypeId,
      media.filesize,
      media.rating,
      media.favorite,
      media.views,
      media.viewedAt,
      videoMetadata.duration,
      videoMetadata.time,
      COALESCE(videoMetadata.width, imageMetadata.width) AS width,
      COALESCE(videoMetadata.height, imageMetadata.height) AS height
    FROM mediaInPlaylists mip
    INNER JOIN media ON media.id = mip.mediaId
    LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
    LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId
    ORDER BY mip.playlistId ASC, mip.\`order\` ASC`,
  )

  const grouped = new Map()

  for (const playlist of playlists) {
    grouped.set(playlist.id, {
      ...playlist,
      count: 0,
      previewIds: [],
      mediaIds: [],
      media: [],
    })
  }

  for (const row of rows) {
    const entry = grouped.get(row.playlistId)
    if (!entry) continue

    const item = {
      id: row.id,
      path: row.path,
      name: row.name,
      basename: row.basename,
      ext: row.ext,
      mediaTypeId: row.mediaTypeId,
      filesize: row.filesize,
      rating: row.rating,
      favorite: row.favorite,
      views: row.views,
      viewedAt: row.viewedAt,
      duration: row.duration,
      time: row.time,
      width: row.width,
      height: row.height,
      tags: [],
      values: [],
      key: String(row.id),
    }

    entry.mediaIds.push(row.mediaId)
    entry.media.push(item)
    entry.count += 1

    if (entry.previewIds.length < 4) {
      entry.previewIds.push(row.mediaId)
    }
  }

  return playlists
    .map((playlist: AnyRecord) => grouped.get(playlist.id))
    .filter(Boolean) as unknown as ParsedDynamicPlaylistSummary[]
}

module.exports = {
  getManualPlaylistsSummary,
}
