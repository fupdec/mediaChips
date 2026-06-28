import type { AssignedMeta, Meta } from '@/types/stores'
import type { MediaType } from '@/types/media'

export type MetaAssignmentMode = 'from-meta' | 'from-media-type'
export type MetaAssignmentView = 'media' | 'tags'

export interface MetaInMediaTypeAssignment extends AssignedMeta {
  mediaTypeId: number
  metaId?: number
  meta?: Meta
}

export interface PinnedChildMetaAssignment extends AssignedMeta {
  metaId?: number
  pinnedMetaId: number
  meta?: Meta
}

export interface MetaInMediaTypeRow extends AssignedMeta {
  metaId: number
  meta?: Meta
}

export interface ConfirmAction {
  title?: string
  text: string
  run: () => void | Promise<void>
}

export interface MetaFieldPoolItem extends Meta {
  disabled?: boolean
  hint?: string
}

export interface MediaTypePreviewField {
  id: number
  icon?: string
  name?: string
  active: boolean
}

export type { MediaType, Meta }
