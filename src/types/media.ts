export const MEDIA_TYPE_VIDEO = 'video' as const
export const MEDIA_TYPE_IMAGE = 'image' as const
export const MEDIA_TYPE_AUDIO = 'audio' as const
export const MEDIA_TYPE_TEXT = 'text' as const

export type MediaTypeKey =
  | typeof MEDIA_TYPE_VIDEO
  | typeof MEDIA_TYPE_IMAGE
  | typeof MEDIA_TYPE_AUDIO
  | typeof MEDIA_TYPE_TEXT
  | string

export interface MediaType {
  id: number
  type?: string
  name?: string
  icon?: string
  extensions?: string
  hidden?: boolean
  order?: number
}

export interface MediaTypeFilterParam {
  media_types?: string[]
  media_type_id?: number[]
}
