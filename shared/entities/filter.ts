export interface FilterObject {
  id: number | null
  param: string | number | null
  type: string | null
  cond: string | null
  val: unknown
  note: string | null
  active: boolean
  lock: boolean
  removed?: boolean
  metaId?: number
}

export interface FilterListParam {
  param: string | number
  type?: string
  icon?: string
  text?: string
  textKey?: string
  group?: string
}

export interface FilterCondition {
  cond: string
  icon: string
  text: string
}

export interface SavedFilter {
  id?: number
  name?: string
  filters?: FilterObject[]
  savedAt?: string
  [key: string]: unknown
}

export interface SavedFilterBasic {
  id: number
  name?: string | null
  [key: string]: unknown
}
