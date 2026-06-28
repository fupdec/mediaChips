import type { Meta } from '@/types/stores'

export interface TagListItem {
  id: number
  name: string
  synonyms?: string
  favorite?: boolean | number
  color?: string
  name_parsed?: string
  synonyms_parsed?: string
  [key: string]: unknown
}

export interface ArrayMeta extends Meta {
  hint?: string
  chipLabel?: boolean
  chipVariant?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc' | string
}

export interface RatingMeta extends Meta {
  ratingMax?: number
  ratingHalf?: boolean
  ratingColor?: string
  ratingIcon?: string
  ratingIconEmpty?: string
  ratingIconHalf?: string
}

export interface CountryEntry {
  name: string
  code: string
}

export interface TagFilterResponse {
  items: TagListItem[]
}

export interface TagCreateResponse extends Array<TagListItem> {}
