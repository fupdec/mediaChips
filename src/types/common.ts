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

export interface FilterObject {
  id: number | null
  param: string | null
  type: string | null
  cond: string | null
  val: unknown
  note: string | null
  active: boolean
  lock: boolean
}

export interface FilterCondition {
  cond: string
  icon: string
  text: string
}

export interface ReadableFileSize {
  number: number | string
  text: string
}

export interface TabLike {
  id?: number | string
  url: string
  [key: string]: unknown
}
