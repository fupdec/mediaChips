export type BulkItemType = 'media' | 'tag'

export type BulkItemId = number | string

export interface MetaEditChange {
  editType?: number | string
  metaId?: number | string
  metaType?: string
  value?: unknown
}

export interface PresetEditChange {
  editType?: number | string
  field?: string
  value?: unknown
}

export interface BulkMetaEditOptions {
  itemType: BulkItemType
  itemIds?: BulkItemId[]
  changes?: MetaEditChange[]
  presetChanges?: PresetEditChange[]
}

export interface BulkMetaEditResult {
  updated: number
  changes: number
}
