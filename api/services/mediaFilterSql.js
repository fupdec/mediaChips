const MEDIA_COLUMNS = new Set([
  'rating',
  'favorite',
  'bookmark',
  'views',
  'viewedAt',
  'createdAt',
  'updatedAt',
  'name',
  'path',
  'filesize',
  'basename',
  'ext',
])

const VIDEO_COLUMNS = new Set(['duration', 'bitrate', 'codec', 'fps', 'time'])
const DIMENSION_COLUMNS = new Set(['width', 'height'])
const IMAGE_ONLY_COLUMNS = new Set(['orientation'])

const SORT_COLUMNS = {
  id: 'media.id',
  rating: 'media.rating',
  favorite: 'media.favorite',
  bookmark: 'media.bookmark',
  views: 'media.views',
  viewedAt: 'media.viewedAt',
  createdAt: 'media.createdAt',
  updatedAt: 'media.updatedAt',
  name: 'media.name',
  path: 'media.path',
  filesize: 'media.filesize',
  basename: 'media.basename',
  ext: 'media.ext',
  duration: 'videoMetadata.duration',
  bitrate: 'videoMetadata.bitrate',
  codec: 'videoMetadata.codec',
  fps: 'videoMetadata.fps',
  time: 'videoMetadata.time',
  width: 'COALESCE(videoMetadata.width, imageMetadata.width)',
  height: 'COALESCE(videoMetadata.height, imageMetadata.height)',
  orientation: 'imageMetadata.orientation',
}

const MEDIA_FROM_JOIN = `
FROM media
LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId`

const NAVIGATION_SELECT = `SELECT
  media.id,
  media.path,
  media.name,
  media.basename,
  media.ext,
  media.mediaTypeId,
  media.filesize,
  COALESCE(videoMetadata.width, imageMetadata.width) AS width,
  COALESCE(videoMetadata.height, imageMetadata.height) AS height,
  videoMetadata.duration,
  media.rating,
  media.favorite,
  media.views,
  media.viewedAt,
  videoMetadata.time`

function resolveMetaId(param) {
  if (typeof param === 'number' && Number.isFinite(param)) return param
  if (typeof param === 'string' && /^\d+$/.test(param)) return Number(param)
  return null
}

function isActiveFilter(filter) {
  const active = filter.active === true || filter.active === 1 || filter.active === '1'
  return active && filter.cond
}

function normalizeActiveFilters(filters = []) {
  return (filters || []).filter(isActiveFilter)
}

function sqlColumn(param) {
  if (MEDIA_COLUMNS.has(param)) return `media.${param}`
  if (VIDEO_COLUMNS.has(param)) return `videoMetadata.${param}`
  if (DIMENSION_COLUMNS.has(param)) {
    return `COALESCE(videoMetadata.${param}, imageMetadata.${param})`
  }
  if (IMAGE_ONLY_COLUMNS.has(param)) return `imageMetadata.${param}`
  return null
}

function compareNumberSql(columnExpr, cond, valueKey) {
  const valueExpr = `CAST(${columnExpr} AS REAL)`
  switch (cond) {
    case 'equal':
    case '=':
      return `${valueExpr} = CAST(${valueKey} AS REAL)`
    case 'not equal':
    case '!==':
      return `${valueExpr} != CAST(${valueKey} AS REAL)`
    case 'greater than':
    case '>':
      return `${valueExpr} > CAST(${valueKey} AS REAL)`
    case 'less than':
    case '<':
      return `${valueExpr} < CAST(${valueKey} AS REAL)`
    case 'greater than or equal':
    case '>=':
      return `${valueExpr} >= CAST(${valueKey} AS REAL)`
    case 'less than or equal':
    case '<=':
      return `${valueExpr} <= CAST(${valueKey} AS REAL)`
    default:
      return null
  }
}

function buildDateComparison(columnExpr, cond, value, nextParam) {
  const valueKey = nextParam(value)
  const columnTime = `CAST(strftime('%s', ${columnExpr}) AS INTEGER)`
  const filterTime = `CAST(strftime('%s', ${valueKey}) AS INTEGER)`

  switch (cond) {
    case 'equal':
    case '=':
      return `${columnTime} = ${filterTime}`
    case 'not equal':
    case '!==':
      return `${columnTime} != ${filterTime}`
    case 'greater than':
    case '>':
      return `${columnTime} > ${filterTime}`
    case 'less than':
    case '<':
      return `${columnTime} < ${filterTime}`
    case 'greater than or equal':
    case '>=':
      return `${columnTime} >= ${filterTime}`
    case 'less than or equal':
    case '<=':
      return `${columnTime} <= ${filterTime}`
    default:
      return null
  }
}

function buildStringComparison(columnExpr, cond, val, nextParam) {
  if (cond === 'is null') {
    return `(${columnExpr} IS NULL OR ${columnExpr} = '')`
  }
  if (cond === 'not null') {
    return `(${columnExpr} IS NOT NULL AND ${columnExpr} != '')`
  }
  if (cond === 'regex') {
    return null
  }

  const normalized = String(val || '').toLowerCase().trim()
  const patternKey = nextParam(`%${normalized}%`)

  if (cond === 'includes' || cond === 'like') {
    return `LOWER(${columnExpr}) LIKE ${patternKey}`
  }
  if (cond === 'excludes' || cond === 'not like') {
    return `(${columnExpr} IS NULL OR LOWER(${columnExpr}) NOT LIKE ${patternKey})`
  }

  return null
}

function buildMetaValueClause(metaId, filter, nextParam) {
  const {type, cond, val} = filter
  const metaKey = nextParam(metaId)
  const valueColumn = `(SELECT vim.value FROM valuesInMedia vim WHERE vim.mediaId = media.id AND vim.metaId = ${metaKey} LIMIT 1)`

  if (type === 'boolean') {
    if (cond === '!=') {
      return `NOT (COALESCE(${valueColumn}, '') IN ('1', 1, 'true', 'TRUE'))`
    }
    return `COALESCE(${valueColumn}, '') IN ('1', 1, 'true', 'TRUE')`
  }

  if (type === 'date') {
    const clause = buildDateComparison(valueColumn, cond, val, nextParam)
    return clause ? `(${clause})` : null
  }

  if (type === 'number' || type === 'rating') {
    if (val === null || val === undefined || val === '') return '0 = 1'
    const valueKey = nextParam(val)
    const clause = compareNumberSql(
      `CAST(${valueColumn} AS REAL)`,
      cond,
      valueKey,
    )
    return clause
      ? `(${valueColumn} IS NOT NULL AND ${valueColumn} != '' AND ${clause})`
      : null
  }

  if (type === 'string') {
    const clause = buildStringComparison(valueColumn, cond, val, nextParam)
    return clause ? `(${clause})` : null
  }

  return null
}

function buildTagArrayClause(metaId, filter, nextParam) {
  const {cond, val} = filter
  const metaKey = nextParam(metaId)
  const tagIds = Array.isArray(val) ? val.filter((id) => id !== null && id !== undefined && id !== '') : []

  if (cond === 'is null') {
    return `NOT EXISTS (
      SELECT 1 FROM tagsInMedia tim
      WHERE tim.mediaId = media.id AND tim.metaId = ${metaKey}
    )`
  }

  if (cond === 'not null') {
    return `EXISTS (
      SELECT 1 FROM tagsInMedia tim
      WHERE tim.mediaId = media.id AND tim.metaId = ${metaKey}
    )`
  }

  if (!tagIds.length) {
    if (cond === 'not in') return '1 = 1'
    if (cond === 'not in all') {
      return `EXISTS (
        SELECT 1 FROM tagsInMedia tim
        WHERE tim.mediaId = media.id AND tim.metaId = ${metaKey}
      )`
    }
    return '0 = 1'
  }

  const tagsKey = nextParam(tagIds)

  if (cond === 'in') {
    return `EXISTS (
      SELECT 1 FROM tagsInMedia tim
      WHERE tim.mediaId = media.id
        AND tim.metaId = ${metaKey}
        AND tim.tagId IN (${tagsKey})
    )`
  }

  if (cond === 'not in') {
    return `NOT EXISTS (
      SELECT 1 FROM tagsInMedia tim
      WHERE tim.mediaId = media.id
        AND tim.metaId = ${metaKey}
        AND tim.tagId IN (${tagsKey})
    )`
  }

  if (cond === 'in all') {
    const countKey = nextParam(tagIds.length)
    return `(
      SELECT COUNT(DISTINCT tim.tagId)
      FROM tagsInMedia tim
      WHERE tim.mediaId = media.id
        AND tim.metaId = ${metaKey}
        AND tim.tagId IN (${tagsKey})
    ) = ${countKey}`
  }

  if (cond === 'not in all') {
    const countKey = nextParam(tagIds.length)
    return `NOT (
      SELECT COUNT(DISTINCT tim.tagId)
      FROM tagsInMedia tim
      WHERE tim.mediaId = media.id
        AND tim.metaId = ${metaKey}
        AND tim.tagId IN (${tagsKey})
    ) = ${countKey}`
  }

  return null
}

function buildFilterClause(filter, nextParam) {
  const {param, type, cond, val} = filter
  const metaId = resolveMetaId(param)

  if (type === 'array' || type === 'select') {
    if (param === 'country') return null
    if (metaId === null) return null
    return buildTagArrayClause(metaId, filter, nextParam)
  }

  if (metaId !== null) {
    return buildMetaValueClause(metaId, filter, nextParam)
  }

  const columnExpr = sqlColumn(param)
  if (!columnExpr) return null

  if (type === 'boolean') {
    if (cond === '!=') {
      return `NOT (COALESCE(${columnExpr}, 0) IN (1, '1', 'true', 'TRUE'))`
    }
    return `COALESCE(${columnExpr}, 0) IN (1, '1', 'true', 'TRUE')`
  }

  if (type === 'date') {
    const clause = buildDateComparison(columnExpr, cond, val, nextParam)
    return clause || null
  }

  if (type === 'number' || type === 'rating') {
    if (val === null || val === undefined || val === '') return '0 = 1'
    const valueKey = nextParam(val)
    const clause = compareNumberSql(columnExpr, cond, valueKey)
    return clause
      ? `(${columnExpr} IS NOT NULL AND ${columnExpr} != '' AND ${clause})`
      : null
  }

  if (type === 'string') {
    const clause = buildStringComparison(columnExpr, cond, val, nextParam)
    return clause || null
  }

  return null
}

function canUseSqlMediaFilters(options = {}) {
  if (options.find_duplicates) return false
  if (options.sortBy === 'shuffle') return false

  const filters = normalizeActiveFilters(options.filters)
  for (const filter of filters) {
    if (filter.type === 'string' && filter.cond === 'regex') return false
    if (filter.param === 'country') return false
    if (!buildFilterClause(filter, () => ':p0')) return false
  }

  return true
}

function buildMediaFilterQuery(filters = [], {mediaTypeId, ids = []} = {}) {
  const replacements = {mediaTypeId}
  let paramIndex = 0

  const nextParam = (value) => {
    const key = `f${paramIndex}`
    paramIndex += 1
    replacements[key] = value
    return `:${key}`
  }

  const clauses = ['media.mediaTypeId = :mediaTypeId']

  if (ids.length) {
    replacements.ids = ids
    clauses.push('media.id IN (:ids)')
  }

  for (const filter of normalizeActiveFilters(filters)) {
    const clause = buildFilterClause(filter, nextParam)
    if (!clause) {
      return {ok: false}
    }
    clauses.push(`(${clause})`)
  }

  return {
    ok: true,
    whereSql: clauses.join(' AND '),
    replacements,
  }
}

function requiresMetadataJoinForSort(sortBy) {
  return VIDEO_COLUMNS.has(sortBy)
    || DIMENSION_COLUMNS.has(sortBy)
    || IMAGE_ONLY_COLUMNS.has(sortBy)
}

function filterRequiresMetadataJoin(filter) {
  const metaId = resolveMetaId(filter.param)
  if (metaId !== null) return false
  if (filter.type === 'array' || filter.type === 'select') return false

  return VIDEO_COLUMNS.has(filter.param)
    || DIMENSION_COLUMNS.has(filter.param)
    || IMAGE_ONLY_COLUMNS.has(filter.param)
}

function requiresMetadataJoinForFilters(filters = []) {
  return normalizeActiveFilters(filters).some(filterRequiresMetadataJoin)
}

function getMediaFromClause(needsMetadataJoin) {
  return needsMetadataJoin ? MEDIA_FROM_JOIN : 'FROM media'
}

function getSortExpression(sortBy) {
  return SORT_COLUMNS[sortBy] || SORT_COLUMNS.id
}

function getMediaFromJoin() {
  return MEDIA_FROM_JOIN
}

function getNavigationSelect() {
  return NAVIGATION_SELECT
}

module.exports = {
  buildMediaFilterQuery,
  canUseSqlMediaFilters,
  filterRequiresMetadataJoin,
  getMediaFromClause,
  getMediaFromJoin,
  getNavigationSelect,
  getSortExpression,
  normalizeActiveFilters,
  requiresMetadataJoinForFilters,
  requiresMetadataJoinForSort,
}
