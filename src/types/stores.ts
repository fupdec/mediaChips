import type { FilterObject } from '@/types/common'
import type { MediaType } from '@/types/media'

export interface MediaItem {
  id: number
  name?: string
  path?: string
  mediaTypeId?: number
  thumb?: string
  views?: number
  favorite?: boolean
  duration?: number
  time?: number
  color?: string
  bookmark?: string
  synonyms?: string
  values?: ItemValueRef[]
  tags?: ItemTagRef[]
  [key: string]: unknown
}

export interface Tag {
  id: number
  metaId?: number
  name?: string
  synonyms?: string
  favorite?: boolean
  color?: string
  bookmark?: string
  values?: ItemValueRef[]
  tags?: ItemTagRef[]
  [key: string]: unknown
}

export interface ItemTagRef {
  tagId: number
  metaId?: number
}

export interface ItemValueRef {
  metaId: number
  value: unknown
}

export interface Meta {
  id: number
  name?: string
  parser?: boolean
  icon?: string
  chipVariant?: string
  color?: boolean
  rating?: boolean
  favorite?: boolean
  synonyms?: boolean
  imageAspectRatio?: number
  hidden?: boolean
  order?: number
  type?: string
  [key: string]: unknown
}

export interface Tab {
  id?: number | string
  url?: string
  [key: string]: unknown
}

export interface Playlist {
  id: number
  [key: string]: unknown
}

export interface AssignedMeta {
  id?: number | string
  order?: number
  meta?: Meta
  [key: string]: unknown
}

export interface SavedFilter {
  id?: number
  name?: string
  filters?: FilterObject[]
  savedAt?: string
  [key: string]: unknown
}

export interface AppHoverState {
  show: boolean
  tagId: number | null
  metaId: number | null
  data_type: string | null
  timeout: ReturnType<typeof setTimeout> | number
  delay: number
  x: number
  y: number
  previewWidth: number
  previewHeight: number
}

export interface AppLogEntry {
  type?: string
  text?: string
  color?: string
  time: number
}

export interface AppState {
  is_app_ready: boolean
  isServerError?: boolean
  localhost: string
  appVersion: string
  app_title: string
  dbPath: string
  mediaPath: string
  databases: unknown[]
  isElectron: boolean | null
  isLocked: boolean
  hover: AppHoverState
  media: unknown[]
  mediaTypes: MediaType[]
  meta: Meta[]
  tags: Tag[]
  playlists: Playlist[]
  tabs: Tab[]
  filters: {
    visible: boolean
    attached: boolean
  }
  syncDarkModeOs: {
    matchMedia: boolean
    func: (() => void) | null
  }
  config: Record<string, unknown>
  window: { focused: boolean }
  log: AppLogEntry[]
}

export interface ItemsEnvironment {
  media_type_id: number | null
  meta_id: number | null
  tag_id: number | null
  tab_id: number | null
}

export interface MarkItem {
  id: number
  [key: string]: unknown
}

export interface MarkFilterMeta {
  id: number
  [key: string]: unknown
}

export interface ContextMenuEntry {
  id?: string
  show?: boolean
  type?: string
  name?: string
  icon?: string
  color?: string
  disabled?: boolean
  action?: (...args: unknown[]) => unknown
  menu?: ContextMenuEntry[]
  [key: string]: unknown
}

export interface ContextMenuPayload {
  x?: number
  y?: number
  content?: ContextMenuEntry[]
  tagMeta?: unknown
}

export interface TaskItem {
  id: string
  title?: string
  subtitle?: string
  icon?: string
  click?: (() => void) | unknown
  action?: (() => void) | unknown
  progress?: number
  color?: string
  done?: boolean
  [key: string]: unknown
}

export interface PlayerPlaylistItem extends MediaItem {
  key: string
}

export interface LicenseInfo {
  license_code?: string
  license_created?: string
  license_expiry?: string
  license_type?: string
  client_email?: string
  client_name?: string
  fingerprint_1?: string
  fingerprint_2?: string
  fingerprint_3?: string
  [key: string]: unknown
}

export interface MoveErrorMessage {
  code?: string
  fileName?: string
  folder?: string
  required?: number
  available?: number
  id?: number
  [key: string]: unknown
}

export interface MoveWsMessage {
  type: string
  total?: number
  totalBytes?: number
  preFailed?: number
  estimatedSeconds?: number
  current?: number
  fileName?: string
  etaSeconds?: number
  overallProgress?: number
  moved?: number
  failed?: number
  elapsedSeconds?: number
  id?: number
  [key: string]: unknown
}
