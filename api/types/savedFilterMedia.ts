import type { FilterLike } from './db'
import type { MediaId } from './mediaFilter'

export type SavedFilterId = number | string

export interface SavedFilterMediaOptions {
  mediaTypeId?: MediaId | null
  sortBy?: string
  direction?: string
  previewLimit?: number | null
}

export interface SavedFilterRowLink {
  filterId: SavedFilterId
  filterRow: FilterLike
}

export interface SavedFilterBasic {
  id: SavedFilterId
  name?: string | null
}

export type TagsByRowIdMap = Map<number | string, Array<{ rowId?: number | string; tagId?: number | string }>>
