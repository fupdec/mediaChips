import type { FilterLike, AnyRecord } from './db'
import type { MediaFilterQueryResult, SqlParamBinder, FilterCondition } from './mediaFilter'

export interface TagFilterOptions {
  metaId?: number | string
  ids?: Array<number | string>
  filters?: FilterLike[]
  find_duplicates?: boolean
  sortBy?: string
}

export type TagFilterQueryResult = MediaFilterQueryResult

export type { SqlParamBinder, AnyRecord, FilterCondition }
