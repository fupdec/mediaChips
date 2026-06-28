import type { MediaItem, Meta, Tag, MarkItem } from '@/types/stores'
import type { HomeWidgetId, HomeWidgetWithLimit } from '@/utils/homeWidgets'

export interface HomeWidgetEditorItem {
  id: HomeWidgetId
  title: string
  icon: string
  enabled: boolean
  hasLimit: boolean
  limit?: number
}

export type HomeMediaCardVariant = 'continue' | 'favorite' | 'views'

export interface HomeMediaItem extends MediaItem {
  thumb?: string
  rating?: number
  viewedAt?: string | number
}

export interface ExtendedStatsByType {
  mediaTypeId: number
  icon?: string
  count: number
  name?: string
}

export interface ExtendedStatsFile {
  id: number
  name?: string
  basename?: string
  filesize?: number
}

export interface ExtendedStats {
  total: number
  byType: ExtendedStatsByType[]
  averageRating: number
  withTags: number
  rated: number
  favorites: number
  addedLast7Days: number
  addedLast30Days: number
  largestFiles: ExtendedStatsFile[]
}

export interface HomeHealthData {
  duplicates: { byFilesize: number; byContentHash: number }
  contentHash: { total: number; pending: number; hashed: number }
  generatedImages: { byType: Record<string, number>; totalPending: number }
  database: { id: number | null; name: string | null; bytes: number | null }
}

export type HealthAlertType = 'error' | 'info' | 'success' | 'warning'

export interface HealthAlertItem {
  id: string
  type: HealthAlertType
  icon: string
  text: string
  actionLabel?: string
  action?: () => void
}

export interface TopTagItem extends Tag {
  image?: string
  views?: number
}

export interface TopTagsCategory {
  meta: Meta
  tags: TopTagItem[]
  limit: number
  total: number
  isNotAllLoaded: boolean
}

export interface HomeMediaStatsResponse {
  total: number
  filesize: number
}

export interface HomeTagCountResponse {
  count: number
}

export interface HomeMarkersResponse {
  marks?: MarkItem[]
}

export type HomeWidgetLimits = Partial<Record<HomeWidgetWithLimit, number>>
