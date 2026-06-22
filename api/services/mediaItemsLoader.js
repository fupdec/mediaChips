const {filterItems} = require('../../app/tasks/items.js')

const MEDIA_BASE_SELECT = `SELECT media.*,
  videoMetadata.duration,
  videoMetadata.bitrate,
  videoMetadata.codec,
  videoMetadata.fps,
  videoMetadata.time,
  COALESCE(videoMetadata.width, imageMetadata.width) AS width,
  COALESCE(videoMetadata.height, imageMetadata.height) AS height,
  imageMetadata.orientation
FROM media
LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId`

const toNavigationItem = (item) => ({
  id: item.id,
  path: item.path,
  name: item.name,
  basename: item.basename,
  ext: item.ext,
  mediaTypeId: item.mediaTypeId,
  filesize: item.filesize,
  width: item.width,
  height: item.height,
  duration: item.duration,
  rating: item.rating,
  favorite: item.favorite,
  views: item.views,
  viewedAt: item.viewedAt,
  time: item.time,
})

const createItemShell = (row) => ({
  ...row,
  tags: [],
  values: [],
  key: String(row.id),
})

async function fetchBaseMediaRows(db, mediaTypeId, ids = []) {
  let query = `${MEDIA_BASE_SELECT} WHERE media.mediaTypeId = :mediaTypeId`
  const replacements = {mediaTypeId}

  if (ids.length) {
    query += ` AND media.id IN (:ids)`
    replacements.ids = ids
  }

  const [rows] = await db.sequelize.query(query, {replacements})
  return rows
}

async function attachMediaRelations(db, items, mediaTypeId, ids = []) {
  if (!items.length) return items

  const mediaIds = items.map((item) => item.id)
  const idSet = new Set(mediaIds)
  const useIdFilter = ids.length > 0

  const tagQuery = useIdFilter
    ? `SELECT mediaId, tagId, metaId FROM tagsInMedia WHERE mediaId IN (:mediaIds)`
    : `SELECT tim.mediaId, tim.tagId, tim.metaId
       FROM tagsInMedia tim
       INNER JOIN media m ON m.id = tim.mediaId
       WHERE m.mediaTypeId = :mediaTypeId`

  const valueQuery = useIdFilter
    ? `SELECT mediaId, value, metaId FROM valuesInMedia WHERE mediaId IN (:mediaIds)`
    : `SELECT vim.mediaId, vim.value, vim.metaId
       FROM valuesInMedia vim
       INNER JOIN media m ON m.id = vim.mediaId
       WHERE m.mediaTypeId = :mediaTypeId`

  const replacements = useIdFilter
    ? {mediaIds}
    : {mediaTypeId}

  const [tagRows] = await db.sequelize.query(tagQuery, {replacements})
  const [valueRows] = await db.sequelize.query(valueQuery, {replacements})

  const tagsByMediaId = new Map()
  const valuesByMediaId = new Map()

  for (const row of tagRows) {
    if (!idSet.has(row.mediaId)) continue
    if (!tagsByMediaId.has(row.mediaId)) tagsByMediaId.set(row.mediaId, [])
    tagsByMediaId.get(row.mediaId).push({
      tagId: Number(row.tagId),
      metaId: Number(row.metaId),
    })
  }

  for (const row of valueRows) {
    if (!idSet.has(row.mediaId)) continue
    if (!valuesByMediaId.has(row.mediaId)) valuesByMediaId.set(row.mediaId, [])
    valuesByMediaId.get(row.mediaId).push({
      value: row.value,
      metaId: Number(row.metaId),
    })
  }

  for (const item of items) {
    item.tags = tagsByMediaId.get(item.id) || []
    item.values = valuesByMediaId.get(item.id) || []
  }

  return items
}

async function loadMediaItems(db, options = {}) {
  const {
    mediaTypeId,
    ids = [],
    filters = [],
    sortBy = 'id',
    direction = 'desc',
    find_duplicates = false,
    duplicates_by = 'filesize',
    page = 1,
    limit = null,
    includeNavigation = false,
  } = options

  const rows = await fetchBaseMediaRows(db, mediaTypeId, ids)
  let items = rows.map(createItemShell)
  await attachMediaRelations(db, items, mediaTypeId, ids)

  const totalUnfiltered = items.length
  const filtered = filterItems(
    filters,
    'media',
    items,
    sortBy,
    direction,
    find_duplicates,
    duplicates_by,
  )

  const totalFiltered = filtered.length
  const totalFilesize = filtered.reduce(
    (sum, item) => sum + (Number(item.filesize) || 0),
    0,
  )

  const shouldPaginate = !ids.length && limit > 0 && limit < 101
  let pageItems = filtered

  if (shouldPaginate) {
    const safePage = Math.max(1, Number(page) || 1)
    const offset = (safePage - 1) * limit
    pageItems = filtered.slice(offset, offset + limit)
  }

  return {
    items: pageItems,
    total: totalUnfiltered,
    totalFiltered,
    totalFilesize,
    navigation: includeNavigation ? filtered.map(toNavigationItem) : undefined,
    page: shouldPaginate ? Math.max(1, Number(page) || 1) : 1,
    limit: shouldPaginate ? limit : totalFiltered,
    pages: shouldPaginate ? Math.max(1, Math.ceil(totalFiltered / limit)) : 1,
  }
}

module.exports = {
  loadMediaItems,
  toNavigationItem,
}
