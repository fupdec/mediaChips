export type { FilterObject, FilterListParam, FilterCondition, SavedFilter } from '@shared/entities/filter'

export interface AppConfig {
  ip?: string
  port?: number | string
}

export interface ServerInfo {
  url?: string
  ip?: string
}

export interface ServerConfigPayload {
  appVersion?: string
  path?: string
  databases?: unknown[]
  [key: string]: unknown
}

export interface ReadableFileSize {
  number: number | string
  text: string
}

export type { TabLike } from '@shared/entities/tab'
