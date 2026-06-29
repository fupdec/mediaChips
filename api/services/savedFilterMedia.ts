import type { ApiDb, FilterLike } from '../types/db'
import type {
  SavedFilterBasic,
  SavedFilterId,
  SavedFilterMediaOptions,
  TagsByRowIdMap,
} from '../types/savedFilterMedia'
import type { ParsedDynamicPlaylistSummary } from '@shared/schemas/filters'
import type { SavedFilterMediaResponse, SavedFilterSummaryResponse } from '@shared/api/responses'

const {parseCountries} = require('../utils/country')
const {normalizeMetaIdParam} = require('../utils/metaId')
const {parseExtList} = require('../utils/ext')
const {
  loadFilteredMediaIds,
  loadMediaPlaylistItems,
  getFilteredMediaSummary,
} = require('./mediaItemsLoader')
const {createSavedFiltersRepository} = require('../db/repositories/savedFilters')
const {createFilterRowsInSavedFiltersRepository} = require('../db/repositories/filterRowsInSavedFilters')
const {createFilterRowsRepository} = require('../db/repositories/filterRows')
const {createTagsInFilterRowsRepository} = require('../db/repositories/tagsInFilterRows')
const {createMediaTypesRepository} = require('../db/repositories/mediaTypes')

function normalizeFilterRow(row: FilterLike, tagsByRowId: TagsByRowIdMap | null = null): FilterLike {
  const normalized: FilterLike = {...row}

  if (normalized.param != null) {
    normalized.param = normalizeMetaIdParam(normalized.param)
  }

  if (normalized.type === 'number' || normalized.type === 'rating') {
    if (normalized.val !== null && normalized.val !== undefined && normalized.val !== '') {
      normalized.val = Number(normalized.val)
    }
  }

  if (typeof normalized.active !== 'undefined') {
    normalized.active = normalized.active === true || normalized.active === 1 || normalized.active === '1'
  }

  if (normalized.type === 'array' && normalized.param !== 'country' && normalized.param !== 'ext') {
    const tags = tagsByRowId?.get(Number(normalized.id)) || []
    normalized.val = tags.map((tag) => tag.tagId)
  } else if (normalized.param === 'country' && normalized.val) {
    normalized.val = parseCountries(normalized.val)
  } else if (normalized.param === 'ext' && normalized.val) {
    normalized.val = parseExtList(normalized.val)
  }

  const {createdAt, updatedAt, ...cleaned} = normalized
  return cleaned
}

async function loadSavedFilterRows(db: ApiDb, savedFilterId: SavedFilterId): Promise<FilterLike[]> {
  const filtersMap = await loadSavedFilterRowsBatch(db, [savedFilterId])
  return filtersMap.get(Number(savedFilterId)) || []
}

async function loadSavedFilterRowsBatch(db: ApiDb, savedFilterIds: SavedFilterId[]) {
  const filterRowsInSavedFiltersRepo = createFilterRowsInSavedFiltersRepository(db.drizzle)
  const filterRowsRepo = createFilterRowsRepository(db.drizzle)
  const tagsInFilterRowsRepo = createTagsInFilterRowsRepository(db.drizzle)

  const filtersBySavedFilterId = new Map<number, FilterLike[]>(
    savedFilterIds.map((id: SavedFilterId) => [Number(id), []]),
  )
  if (!savedFilterIds.length) return filtersBySavedFilterId

  const links = filterRowsInSavedFiltersRepo.findByFilterIds(savedFilterIds.map((id) => Number(id)))

  const rowIds: number[] = []
  const linkEntries: Array<{ filterId: SavedFilterId; filterRow: FilterLike }> = []

  for (const link of links) {
    const filterRow = filterRowsRepo.findById(link.rowId)
    if (!filterRow) continue

    rowIds.push(Number(filterRow.id))
    linkEntries.push({
      filterId: link.filterId as SavedFilterId,
      filterRow: filterRow as FilterLike,
    })
  }

  const tagRows = tagsInFilterRowsRepo.findByRowIds(rowIds)

  const tagsByRowId: TagsByRowIdMap = new Map()
  for (const tag of tagRows) {
    const rowId = Number(tag.rowId)
    if (!tagsByRowId.has(rowId)) tagsByRowId.set(rowId, [])
    tagsByRowId.get(rowId)!.push({
      rowId: tag.rowId as number | string,
      tagId: tag.tagId as number | string,
    })
  }

  for (const {filterId, filterRow} of linkEntries) {
    const cleaned = normalizeFilterRow(filterRow, tagsByRowId)
    filtersBySavedFilterId.get(Number(filterId))?.push(cleaned)
  }

  return filtersBySavedFilterId
}

async function getVideoMediaTypeId(db: ApiDb) {
  const mediaTypesRepo = createMediaTypesRepository(db.drizzle)
  const videoType = mediaTypesRepo.findByType('video')
  return videoType?.id || null
}

async function getFilteredMediaForSavedFilter(
  db: ApiDb,
  savedFilterId: SavedFilterId,
  options: SavedFilterMediaOptions = {},
): Promise<SavedFilterMediaResponse & { previewIds?: number[] }> {
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

async function getSavedFilterPlaylistSummary(
  db: ApiDb,
  savedFilterId: SavedFilterId,
  options: SavedFilterMediaOptions = {},
): Promise<SavedFilterSummaryResponse> {
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

async function getDynamicPlaylistsBasic(db: ApiDb): Promise<SavedFilterBasic[]> {
  const savedFiltersRepo = createSavedFiltersRepository(db.drizzle)
  const mediaTypeId = await getVideoMediaTypeId(db)
  if (!mediaTypeId) return []

  return savedFiltersRepo.findDynamicPlaylists(mediaTypeId).map((savedFilter: {id: number; name: string | null}) => ({
    id: savedFilter.id as SavedFilterId,
    name: savedFilter.name,
  }))
}

async function getDynamicPlaylistsSummary(db: ApiDb): Promise<ParsedDynamicPlaylistSummary[]> {
  const savedFiltersRepo = createSavedFiltersRepository(db.drizzle)
  const mediaTypeId = await getVideoMediaTypeId(db)
  if (!mediaTypeId) return []

  const savedFilters = savedFiltersRepo.findDynamicPlaylistsFull(mediaTypeId)

  if (!savedFilters.length) return []

  const filtersBySavedFilterId = await loadSavedFilterRowsBatch(
    db,
    savedFilters.map((savedFilter: {id: number}) => savedFilter.id as SavedFilterId),
  )

  const summaries = await Promise.all(savedFilters.map(async (savedFilter: {id: number; name: string | null}) => {
    const filters = filtersBySavedFilterId.get(Number(savedFilter.id)) || []
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

  return summaries as unknown as ParsedDynamicPlaylistSummary[]
}

async function getFilteredMediaForPlayback(
  db: ApiDb,
  savedFilterId: SavedFilterId,
  options: SavedFilterMediaOptions = {},
): Promise<SavedFilterMediaResponse> {
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
