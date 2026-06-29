export interface Tab {
  id?: number | string
  url?: string
  name?: string
  [key: string]: unknown
}

export interface TabLike {
  id?: number | string
  url: string
  [key: string]: unknown
}
