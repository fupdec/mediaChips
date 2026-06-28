import type { ComputedRef, Ref } from 'vue'
import type { AxiosResponse } from 'axios'
import type { FilterObject } from '@/types/common'
import type { MediaType } from '@/types/media'
import type { AssignedMeta, MediaItem, Meta, SavedFilter } from '@/types/stores'

export type ItemsPageType = 'media' | 'tag'

export interface ItemsPageProps {
  items_type: ItemsPageType | string
  tagId?: number
  mediaTypeId?: number
  metaId?: number
  tabId?: number
}

export interface ItemsPageLoader {
  show: boolean
  timeout: ReturnType<typeof setTimeout> | number
  is_busy: boolean
}

export interface MediaListResponseData {
  items?: MediaItem[]
  totalFiltered?: number
  totalFilesize?: number
  total?: number
  pages?: number
  page?: number
  navigation?: MediaItem[]
}

export type MediaListResponse = AxiosResponse<MediaListResponseData>

export interface ItemsPageListQuery {
  metaId?: number
  mediaTypeId?: number
  filters?: FilterObject[]
  sortBy?: string
  direction?: string
  find_duplicates?: boolean
  duplicates_by?: string
  ids?: number[]
  includeNavigation?: boolean
  page?: number
  limit?: number
  skipTotals?: boolean
}

export interface PageSettingData {
  page?: number
  limit?: number
  size?: number
  view?: number | string
  sortBy?: string
  sortDir?: string
  filterId?: number
  query?: unknown
}

export interface PageSettingsRecord {
  page?: number
  limit?: number
  size?: number
  view?: number | string
  sortBy?: string
  sortDir?: string
  filterId?: number
  [key: string]: unknown
}

export interface ItemsPageInitDeps {
  disposeListFetching: () => void
  resetMediaListState: () => void
  getItemsFromDb: (ids?: number[]) => Promise<void>
}

export interface UseItemsPageOptions {
  props: ItemsPageProps
  mediaType: Ref<MediaType | null>
  container: Ref<HTMLElement | null>
  updatePageSetting: (data: PageSettingData) => Promise<void>
}

export interface UseItemsPageInitOptions {
  props: ItemsPageProps
  mediaType: Ref<MediaType | null>
  meta: Ref<Meta | null>
}

export interface UseItemsPageEventsOptions {
  props: ItemsPageProps
  mediaType: Ref<MediaType | null>
  meta: Ref<Meta | null>
  loader: Ref<ItemsPageLoader>
  total: Ref<number>
  totalInDb: Ref<number>
  is_infinite_scroll: ComputedRef<boolean>
  init: () => Promise<void>
  loadSavedFilters: () => void
  updatePageSetting: (data: PageSettingData) => Promise<void>
  getFilters: () => Promise<void>
  getPinnedMeta: () => Promise<void>
  getItemsFromDb: (ids?: number[]) => Promise<void>
  getEntitiesOnPage: (ids_remove?: number[]) => void
  bindMediaInfiniteScroll: () => void
  unbindMediaInfiniteScroll: () => void
  disposeListFetching: () => void
  maybeLoadMoreIfNearBottom: () => void
  refreshScrollRoot: () => Element | null
}

export interface GetItemsFromDbEvent {
  ids?: number[]
  type: string
}

export interface RemoveEntitiesEvent {
  ids: number[]
  type: string
}

export interface InfiniteIntersectOptions {
  handler: (isIntersecting: boolean) => void
  options: {
    root: Element | null
    rootMargin: string
    threshold: number
  }
}

export interface ItemContextMenuEntry {
  name?: string
  type: string
  icon?: string
  color?: string
  disabled?: boolean
  action?: (...args: unknown[]) => unknown
  menu?: ItemContextMenuEntry[]
}

export interface PresetMetaProps {
  item: MediaItem
  type: ItemsPageType | string
  isShowAll?: boolean
}

export interface PresetMetaParam {
  name: string
  text: string
  icon: string
  types: string[]
  media_types?: string[]
  show?: boolean
  value?: unknown
}

export interface MarkWithMedium {
  id: number
  mediaId?: number
  medium?: {
    id?: number
    path?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

import type { WatchedFolderEntry } from '@/services/watcherUtils'

export interface WatcherWsPayload {
  type: string
  folders?: WatchedFolderEntry[]
  extensions?: Record<string, unknown>
}

export interface ItemsPageStoreUpdates {
  type?: string
  isFiltersLoaded?: boolean
  itemsOnPage?: MediaItem[]
  entities?: MediaItem[]
  navigationItems?: MediaItem[]
  totalFiltered?: number
  meta?: Meta
  name?: string
  icon?: string
  filters?: FilterObject[]
  savedFilter?: SavedFilter
  assigned?: AssignedMeta[]
  page?: number
  limit?: number
  size?: number
  view?: number | string
  sortBy?: string
  sortDir?: string
  [key: string]: unknown
}
