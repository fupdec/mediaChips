import type { AssignedMeta, Meta } from '@/types/stores'
import type { MediaType } from '@/types/media'
import type {
  MetaInMediaTypeAssignmentRow,
  MetaInMediaTypeRow as SharedMetaInMediaTypeRow,
  PinnedChildMetaAssignmentRow,
} from '@shared/entities/meta'

export type MetaAssignmentMode = 'from-meta' | 'from-media-type'
export type MetaAssignmentView = 'media' | 'tags'

export type MetaInMediaTypeAssignment = MetaInMediaTypeAssignmentRow & {
  mediaType?: MediaType
  meta?: Meta
}

export type PinnedChildMetaAssignment = PinnedChildMetaAssignmentRow & {
  meta?: Meta
}

export type MetaInMediaTypeRow = SharedMetaInMediaTypeRow & {
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

export type { MediaType, Meta, AssignedMeta }
