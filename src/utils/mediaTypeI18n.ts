import type { MediaType } from '@/types/media'

const MEDIA_TYPE_KEYS: Record<string, string> = {
  video: 'video',
  videos: 'video',
  movie: 'video',
  movies: 'video',
  image: 'image',
  images: 'image',
  photo: 'image',
  photos: 'image',
  audio: 'audio',
  audios: 'audio',
  music: 'audio',
  text: 'text',
  texts: 'text',
  book: 'book',
  books: 'book',
  document: 'document',
  documents: 'document',
}

type TranslateFn = (key: string, fallback?: string) => string

export const getMediaTypeName = (mediaType: MediaType | null | undefined, t: TranslateFn): string => {
  const fallback = mediaType?.name || ''
  const source = mediaType?.type || mediaType?.name || ''
  const key = MEDIA_TYPE_KEYS[source.toString().trim().toLowerCase()]

  return key ? t(`media.type_names.${key}`, fallback) : fallback
}
