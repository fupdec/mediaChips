import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const {filterItems} = require('../../app/tasks/items.js')
const {
  buildMediaFilterQuery,
  canUseSqlMediaFilters,
  getMediaFromClause,
  getNavigationSelect,
  getSortExpression,
  requiresMetadataJoinForFilters,
  requiresMetadataJoinForSort,
} = require('./mediaFilterSql')

function buildFilteredTotalsSql(fromClause: any, whereClause: any, needsDistinct: any) {
  if (!needsDistinct) {
    return `SELECT COUNT(*) AS totalFiltered,
      COALESCE(SUM(media.filesize), 0) AS totalFilesize
      ${fromClause}
      ${whereClause}`
  }

  return `SELECT COUNT(*) AS totalFiltered,
    COALESCE(SUM(filesize), 0) AS totalFilesize
    FROM (
      SELECT DISTINCT media.id, media.filesize
      ${fromClause}
      ${whereClause}
    )`
}

function buildFilteredCountSql(fromClause: any, whereClause: any, needsDistinct: any) {
  if (!needsDistinct) {
    return `SELECT COUNT(*) AS totalFiltered
      ${fromClause}
      ${whereClause}`
  }

  return `SELECT COUNT(*) AS totalFiltered
    FROM (
      SELECT DISTINCT media.id
      ${fromClause}
      ${whereClause}
    )`
}

function buildMediaIdSelect(needsDistinct: any) {
  return needsDistinct ? 'SELECT DISTINCT media.id' : 'SELECT media.id'
}

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

const toNavigationItem = (item: any) => ({
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

const createItemShell = (row: any) => ({
  ...row,
  tags: [],
  values: [],
  key: String(row.id),
})

async function fetchBaseMediaRows(db: ApiDb, mediaTypeId: any, ids: any= []) {
  if (ids.length) {
    const [rows] = await db.sequelize.query(
      `${MEDIA_BASE_SELECT} WHERE media.id IN (:ids)`,
      {replacements: {ids}},
    )
    return rows
  }

  if (!mediaTypeId) return []

  const [rows] = await db.sequelize.query(
    `${MEDIA_BASE_SELECT} WHERE media.mediaTypeId = :mediaTypeId`,
    {replacements: {mediaTypeId}},
  )
  return rows
}

async function attachMediaRelations(db: ApiDb, items: any, mediaTypeId: any, ids: any= []) {
  if (!items.length) return items

  const mediaIds = items.map((item: any) => item.id)
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

function orderRowsByIds(rows: AnyRecord[], ids: any) {
  const rowsById = new Map(rows.map((row: any) => [row.id, row]))
  return ids.map((id: any) => rowsById.get(id)).filter(Boolean)
}

async function loadMediaItemsLegacy(db: ApiDb, options: Record<string, any> = {}) {
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
    (sum: number, item: any) => sum + (Number(item.filesize) || 0),
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

async function loadMediaItemsSql(db: ApiDb, options: Record<string, any> = {}) {
  const {
    mediaTypeId,
    ids = [],
    filters = [],
    sortBy = 'id',
    direction = 'desc',
    page = 1,
    limit = null,
    includeNavigation = false,
    skipTotals = false,
  } = options

  const filterQuery = buildMediaFilterQuery(filters, {mediaTypeId, ids})
  if (!filterQuery.ok) {
    return loadMediaItemsLegacy(db, options)
  }

  const {whereSql, joinSql = '', needsDistinct = false, replacements} = filterQuery
  const whereClause = `WHERE ${whereSql}`
  const sortExpr = getSortExpression(sortBy)
  const sortDir = direction === 'asc' ? 'ASC' : 'DESC'
  const joinForFilters = requiresMetadataJoinForFilters(filters)
  const joinForSort = requiresMetadataJoinForSort(sortBy)
  const fromForCount = getMediaFromClause(joinForFilters, joinSql)
  const fromForSort = getMediaFromClause(joinForFilters || joinForSort, joinSql)
  const idSelect = buildMediaIdSelect(needsDistinct)

  const shouldPaginate = !ids.length && limit > 0 && limit < 101
  const safePage = Math.max(1, Number(page) || 1)
  const pageLimit = shouldPaginate ? limit : null
  const queryReplacements = {...replacements}

  let idQuery = `${idSelect}
    ${fromForSort}
    ${whereClause}
    ORDER BY ${sortExpr} ${sortDir}`

  if (shouldPaginate) {
    queryReplacements.limit = pageLimit
    queryReplacements.offset = (safePage - 1) * pageLimit
    idQuery += ' LIMIT :limit OFFSET :offset'
  }

  const queries = [db.sequelize.query(idQuery, {replacements: queryReplacements})]

  if (!skipTotals) {
    queries.push(
      db.sequelize.query(
        buildFilteredTotalsSql(fromForCount, whereClause, needsDistinct),
        {replacements},
      ),
      db.sequelize.query(
        `SELECT COUNT(*) AS totalUnfiltered
         FROM media
         WHERE media.mediaTypeId = :mediaTypeId`,
        {replacements: {mediaTypeId}},
      ),
    )
  }

  const results = await Promise.all(queries)
  const [idRows] = results[0]

  let totalUnfiltered = null
  let totalFiltered = null
  let totalFilesize = null

  if (!skipTotals) {
    const [[totals]] = results[1]
    const [[unfiltered]] = results[2]
    totalUnfiltered = Number(unfiltered.totalUnfiltered) || 0
    totalFiltered = Number(totals.totalFiltered) || 0
    totalFilesize = Number(totals.totalFilesize) || 0
  }

  const pageIds = idRows.map((row: any) => row.id)

  let navigation
  if (includeNavigation) {
    const navSelect = needsDistinct
      ? getNavigationSelect().replace('SELECT', 'SELECT DISTINCT')
      : getNavigationSelect()
    const [navRows] = await db.sequelize.query(
      `${navSelect}
      ${fromForSort}
      ${whereClause}
      ORDER BY ${sortExpr} ${sortDir}`,
      {replacements},
    )
    navigation = navRows.map(toNavigationItem)
  }

  const rows = pageIds.length
    ? await fetchBaseMediaRows(db, mediaTypeId, pageIds)
    : []
  const orderedRows = orderRowsByIds(rows, pageIds)
  let items = orderedRows.map(createItemShell)
  await attachMediaRelations(db, items, mediaTypeId, pageIds)

  const result: Record<string, any> = {
    items,
    total: totalUnfiltered,
    totalFiltered,
    totalFilesize,
    navigation,
    page: shouldPaginate ? safePage : 1,
    limit: shouldPaginate ? pageLimit : (totalFiltered ?? items.length),
  }

  if (!skipTotals && shouldPaginate && totalFiltered != null) {
    result.pages = Math.max(1, Math.ceil(totalFiltered / pageLimit))
  }

  return result
}

async function loadMediaItems(db: ApiDb, options: Record<string, any> = {}) {
  if (canUseSqlMediaFilters(options)) {
    return loadMediaItemsSql(db, options)
  }
  return loadMediaItemsLegacy(db, options)
}

async function loadMediaPool(db: ApiDb, mediaTypeId: any) {
  const rows = await fetchBaseMediaRows(db, mediaTypeId)
  const items = rows.map(createItemShell)
  await attachMediaRelations(db, items, mediaTypeId)
  return items
}

async function getFilteredMediaSummary(db: ApiDb, options: Record<string, any> = {}) {
  const {
    mediaTypeId,
    filters = [],
    sortBy = 'id',
    direction = 'desc',
    previewLimit = 4,
    find_duplicates = false,
    duplicates_by = 'filesize',
  } = options

  if (find_duplicates || !canUseSqlMediaFilters(options)) {
    const result = await loadMediaItemsLegacy(db, {
      ...options,
      limit: null,
      includeNavigation: false,
    })

    return {
      count: result.totalFiltered,
      previewIds: result.items.slice(0, previewLimit).map((item: any) => item.id),
    }
  }

  const filterQuery = buildMediaFilterQuery(filters, {mediaTypeId, ids: []})
  if (!filterQuery.ok) {
    const result = await loadMediaItemsLegacy(db, {
      ...options,
      limit: null,
      includeNavigation: false,
    })

    return {
      count: result.totalFiltered,
      previewIds: result.items.slice(0, previewLimit).map((item: any) => item.id),
    }
  }

  const {whereSql, joinSql = '', needsDistinct = false, replacements} = filterQuery
  const whereClause = `WHERE ${whereSql}`
  const joinForFilters = requiresMetadataJoinForFilters(filters)
  const joinForSort = requiresMetadataJoinForSort(sortBy)
  const fromForCount = getMediaFromClause(joinForFilters, joinSql)
  const fromForSort = getMediaFromClause(joinForFilters || joinForSort, joinSql)
  const sortExpr = getSortExpression(sortBy)
  const sortDir = direction === 'asc' ? 'ASC' : 'DESC'
  const idSelect = buildMediaIdSelect(needsDistinct)

  const [countQuery, previewQuery] = await Promise.all([
    db.sequelize.query(
      buildFilteredCountSql(fromForCount, whereClause, needsDistinct),
      {replacements},
    ),
    db.sequelize.query(
      `${idSelect}
      ${fromForSort}
      ${whereClause}
      ORDER BY ${sortExpr} ${sortDir}
      LIMIT :previewLimit`,
      {replacements: {...replacements, previewLimit}},
    ),
  ])

  const totals = countQuery[0][0] || {}
  const previewRows = previewQuery[0]

  return {
    count: Number(totals.totalFiltered) || 0,
    previewIds: previewRows.map((row: any) => row.id),
  }
}

async function loadFilteredMediaIds(db: ApiDb, options: Record<string, any> = {}) {
  if (options.find_duplicates || !canUseSqlMediaFilters(options)) {
    const result = await loadMediaItemsLegacy(db, {
      ...options,
      limit: null,
      includeNavigation: false,
    })

    return {
      ids: result.items.map((item: any) => item.id),
      totalFiltered: result.totalFiltered,
      totalFilesize: result.totalFilesize,
    }
  }

  const {
    mediaTypeId,
    filters = [],
  } = options

  const filterQuery = buildMediaFilterQuery(filters, {mediaTypeId, ids: []})
  if (!filterQuery.ok) {
    const result = await loadMediaItemsLegacy(db, {
      ...options,
      limit: null,
      includeNavigation: false,
    })

    return {
      ids: result.items.map((item: any) => item.id),
      totalFiltered: result.totalFiltered,
      totalFilesize: result.totalFilesize,
    }
  }

  const {whereSql, joinSql = '', needsDistinct = false, replacements} = filterQuery
  const whereClause = `WHERE ${whereSql}`
  const joinForFilters = requiresMetadataJoinForFilters(options.filters || [])
  const joinForSort = requiresMetadataJoinForSort(options.sortBy || 'id')
  const fromForCount = getMediaFromClause(joinForFilters, joinSql)
  const fromForSort = getMediaFromClause(joinForFilters || joinForSort, joinSql)
  const idSelect = buildMediaIdSelect(needsDistinct)

  const [countQuery, idQuery] = await Promise.all([
    db.sequelize.query(
      buildFilteredTotalsSql(fromForCount, whereClause, needsDistinct),
      {replacements},
    ),
    db.sequelize.query(
      `${idSelect}
      ${fromForSort}
      ${whereClause}
      ORDER BY ${getSortExpression(options.sortBy || 'id')} ${options.direction === 'asc' ? 'ASC' : 'DESC'}`,
      {replacements},
    ),
  ])

  const totals = countQuery[0][0] || {}
  const idRows = idQuery[0]

  return {
    ids: idRows.map((row: any) => row.id),
    totalFiltered: Number(totals.totalFiltered) || 0,
    totalFilesize: Number(totals.totalFilesize) || 0,
  }
}

async function loadMediaBasicsByIds(db: ApiDb, ids: any= []) {
  if (!ids.length) return []

  const [rows] = await db.sequelize.query(
    `SELECT id, path, name, basename, filesize, mediaTypeId
     FROM media
     WHERE id IN (:ids)`,
    {replacements: {ids}},
  )

  return rows
}

async function loadMediaPlaylistItems(db: ApiDb, ids: any= []) {
  if (!ids.length) return []

  const [rows] = await db.sequelize.query(
    `SELECT
      id, path, name, basename, ext, mediaTypeId,
      filesize, rating, favorite, views, viewedAt
     FROM media
     WHERE id IN (:ids)`,
    {replacements: {ids}},
  )

  const orderedRows = orderRowsByIds(rows, ids)
  return orderedRows.map(createItemShell)
}

async function loadMediaForPlayback(db: ApiDb, ids: any= []) {
  if (!ids.length) return []

  const rows = await fetchBaseMediaRows(db, null, ids)
  const orderedRows = orderRowsByIds(rows, ids)
  return orderedRows.map(createItemShell)
}

module.exports = {
  loadMediaItems,
  loadMediaPool,
  getFilteredMediaSummary,
  loadFilteredMediaIds,
  loadMediaBasicsByIds,
  loadMediaPlaylistItems,
  loadMediaForPlayback,
  toNavigationItem,
}
