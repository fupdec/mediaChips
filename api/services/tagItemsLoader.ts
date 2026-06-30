import type { ApiDb, FilterLike } from '../types/db'
import type { DbItemRow } from '../../app/types/items'
import { parseItemsFromDb, filterItems } from '../../app/tasks/items'
import { createTagsRepository } from '../db/repositories/tags'
import {
  resolvePageLimit,
  shouldPaginateMediaList,
  slicePage,
} from './mediaItemsPagination'

export interface TagLoadOptions {
  metaId: number
  ids?: number[]
  filters?: FilterLike[]
  sortBy?: string
  direction?: string
  find_duplicates?: boolean
  page?: number
  limit?: number | null
  skipTotals?: boolean
}

export function loadTagItems(db: ApiDb, options: TagLoadOptions) {
  const tagsRepo = createTagsRepository(db.drizzle, db.sqlite)
  const {
    metaId,
    ids = [],
    filters = [],
    sortBy = 'id',
    direction = 'desc',
    find_duplicates = false,
    page = 1,
    limit = null,
    skipTotals = false,
  } = options

  const data = tagsRepo.getItemsForMeta(metaId, ids)
  const itemsAll = parseItemsFromDb(data as DbItemRow[])
  const itemsFiltered = filterItems(
    filters,
    'tags',
    itemsAll,
    sortBy,
    direction,
    find_duplicates,
  )

  const totalUnfiltered = itemsAll.length
  const totalFiltered = itemsFiltered.length
  const pageLimit = resolvePageLimit(limit)
  const shouldPaginate = shouldPaginateMediaList({ids, limit})
  const safePage = Math.max(1, Number(page) || 1)
  const pageItems = shouldPaginate
    ? slicePage(itemsFiltered, page, limit)
    : itemsFiltered

  const result: Record<string, unknown> = {
    items: pageItems,
    total: totalUnfiltered,
    totalFiltered,
    page: shouldPaginate ? safePage : 1,
    limit: shouldPaginate ? pageLimit : totalFiltered,
  }

  if (!skipTotals && shouldPaginate && pageLimit != null) {
    result.pages = Math.max(1, Math.ceil(totalFiltered / pageLimit))
  }

  return result
}
