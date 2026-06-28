import type { Meta } from '@/types/stores'

export interface ScraperPoster {
  id: string | number
  url: string
  size: number
}

export interface ScraperSelectedResult {
  extras?: Record<string, unknown>
  posters?: ScraperPoster[]
}

export interface ScraperPinnedItem {
  scraper?: string
  pinnedMetaId?: number
  metaId?: number
  meta?: Meta
  [key: string]: unknown
}

export interface ScraperTransferField {
  dataType?: string
  valueCurrent: unknown
  valueReserved: unknown
  valueScraper?: unknown
  isTagExists?: boolean
  key: string
  meta: Meta
  isTransfered: boolean
  isAlreadyContain?: boolean
}

export interface ScraperMultiplePerformer {
  performer: { id: number | string; name?: string }
  result: ScraperSelectedResult
}
