const {Op} = require('sequelize')
const {parseCountries} = require('../utils/country')
const {
  loadFilteredMediaIds,
  loadMediaPlaylistItems,
  getFilteredMediaSummary,
} = require('./mediaItemsLoader')

function normalizeFilterRow(row, tagsByRowId = null) {
  const normalized = {...row}

  if (normalized.param != null && /^\d+$/.test(String(normalized.param))) {
    normalized.param = Number(normalized.param)
  }

  if (normalized.type === 'number' || normalized.type === 'rating') {
    if (normalized.val !== null && normalized.val !== undefined && normalized.val !== '') {
      normalized.val = Number(normalized.val)
    }
  }

  if (typeof normalized.active !== 'undefined') {
    normalized.active = normalized.active === true || normalized.active === 1 || normalized.active === '1'
  }

  if (normalized.type === 'array' && normalized.param !== 'country') {
    const tags = tagsByRowId?.get(normalized.id) || []
    normalized.val = tags.map((tag) => tag.tagId)
  } else if (normalized.param === 'country' && normalized.val) {
    normalized.val = parseCountries(normalized.val)
  }

  const {createdAt, updatedAt, ...cleaned} = normalized
  return cleaned
}

async function loadSavedFilterRows(db, savedFilterId) {
  const filtersMap = await loadSavedFilterRowsBatch(db, [savedFilterId])
  return filtersMap.get(savedFilterId) || []
}

async function loadSavedFilterRowsBatch(db, savedFilterIds) {
  const filtersBySavedFilterId = new Map(savedFilterIds.map((id) => [id, []]))
  if (!savedFilterIds.length) return filtersBySavedFilterId

  const links = await db.FilterRowsInSavedFilter.findAll({
    where: {filterId: {[Op.in]: savedFilterIds}},
    include: [db.FilterRow],
  })

  const rowIds = []
  const linkEntries = []

  for (const link of links) {
    const filterRow = link.filterRow?.get?.({plain: true}) || link.filterRow
    if (!filterRow) continue

    rowIds.push(filterRow.id)
    linkEntries.push({
      filterId: link.filterId,
      filterRow,
    })
  }

  const tagRows = rowIds.length
    ? await db.TagsInFilterRow.findAll({
      where: {rowId: {[Op.in]: rowIds}},
      raw: true,
    })
    : []

  const tagsByRowId = new Map()
  for (const tag of tagRows) {
    if (!tagsByRowId.has(tag.rowId)) tagsByRowId.set(tag.rowId, [])
    tagsByRowId.get(tag.rowId).push(tag)
  }

  for (const {filterId, filterRow} of linkEntries) {
    const cleaned = normalizeFilterRow(filterRow, tagsByRowId)
    filtersBySavedFilterId.get(filterId)?.push(cleaned)
  }

  return filtersBySavedFilterId
}

async function getVideoMediaTypeId(db) {
  const videoType = await db.MediaType.findOne({
    where: {type: 'video'},
    raw: true,
  })
  return videoType?.id || null
}

async function getFilteredMediaForSavedFilter(db, savedFilterId, options = {}) {
  const {
    mediaTypeId = await getVideoMediaTypeId(db),
    sortBy = 'id',
    direction = 'desc',
    previewLimit = null,
  } = options

  if (!mediaTypeId) {
    return {items: [], count: 0, previewIds: []}
  }

  const filters = await loadSavedFilterRows(db, savedFilterId)
  const idsResult = await loadFilteredMediaIds(db, {
    mediaTypeId,
    filters,
    sortBy,
    direction,
    find_duplicates: false,
    duplicates_by: 'filesize',
  })

  const targetIds = previewLimit
    ? idsResult.ids.slice(0, previewLimit)
    : idsResult.ids

  const items = await loadMediaPlaylistItems(db, targetIds)

  return {
    items,
    count: idsResult.totalFiltered,
    previewIds: idsResult.ids.slice(0, 4),
  }
}

async function getSavedFilterPlaylistSummary(db, savedFilterId, options = {}) {
  const {
    mediaTypeId = await getVideoMediaTypeId(db),
    sortBy = 'id',
    direction = 'desc',
    previewLimit = 4,
  } = options

  if (!mediaTypeId) {
    return {count: 0, previewIds: []}
  }

  const filters = await loadSavedFilterRows(db, savedFilterId)

  return getFilteredMediaSummary(db, {
    mediaTypeId,
    filters,
    sortBy,
    direction,
    previewLimit,
    find_duplicates: false,
    duplicates_by: 'filesize',
  })
}

async function getDynamicPlaylistsBasic(db) {
  const mediaTypeId = await getVideoMediaTypeId(db)
  if (!mediaTypeId) return []

  const savedFilters = await db.SavedFilter.findAll({
    where: {
      name: {[Op.not]: null},
      mediaTypeId,
    },
    order: [['name', 'ASC']],
    attributes: ['id', 'name'],
    raw: true,
  })

  return savedFilters.map((savedFilter) => ({
    id: savedFilter.id,
    name: savedFilter.name,
  }))
}

async function getDynamicPlaylistsSummary(db) {
  const mediaTypeId = await getVideoMediaTypeId(db)
  if (!mediaTypeId) return []

  const savedFilters = await db.SavedFilter.findAll({
    where: {
      name: {[Op.not]: null},
      mediaTypeId,
    },
    order: [['name', 'ASC']],
    raw: true,
  })

  if (!savedFilters.length) return []

  const filtersBySavedFilterId = await loadSavedFilterRowsBatch(
    db,
    savedFilters.map((savedFilter) => savedFilter.id),
  )

  const summaries = await Promise.all(savedFilters.map(async (savedFilter) => {
    const filters = filtersBySavedFilterId.get(savedFilter.id) || []
    const summary = await getFilteredMediaSummary(db, {
      mediaTypeId,
      filters,
      sortBy: 'id',
      direction: 'desc',
      previewLimit: 4,
      find_duplicates: false,
      duplicates_by: 'filesize',
    })

    return {
      id: savedFilter.id,
      name: savedFilter.name,
      count: Number(summary.count) || 0,
      previewIds: summary.previewIds || [],
    }
  }))

  return summaries
}

async function getFilteredMediaForPlayback(db, savedFilterId, options = {}) {
  const {
    mediaTypeId = await getVideoMediaTypeId(db),
    sortBy = 'id',
    direction = 'desc',
  } = options

  if (!mediaTypeId) {
    return {items: [], count: 0}
  }

  const filters = await loadSavedFilterRows(db, savedFilterId)
  const idsResult = await loadFilteredMediaIds(db, {
    mediaTypeId,
    filters,
    sortBy,
    direction,
    find_duplicates: false,
    duplicates_by: 'filesize',
  })

  const items = await loadMediaPlaylistItems(db, idsResult.ids)

  return {
    items,
    count: idsResult.totalFiltered,
  }
}

module.exports = {
  getDynamicPlaylistsBasic,
  getDynamicPlaylistsSummary,
  getSavedFilterPlaylistSummary,
  getFilteredMediaForPlayback,
  getFilteredMediaForSavedFilter,
  getVideoMediaTypeId,
  loadSavedFilterRows,
  loadSavedFilterRowsBatch,
}
