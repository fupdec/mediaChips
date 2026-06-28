import type { AnyRecord } from '../../api/types/db'

export interface ParsedTagLink {
  tagId: number
  metaId: number
}

export interface ParsedValueLink {
  value: string
  metaId: number
}

export interface ParsedItemTags {
  tags: ParsedTagLink[]
  values: ParsedValueLink[]
  key: string
}

export type ParsedItem = AnyRecord & ParsedItemTags

export type DbItemRow = AnyRecord & {
  id?: number | string
  media_tags?: string
  media_values?: string
  tag_tags?: string
  tag_values?: string
}
